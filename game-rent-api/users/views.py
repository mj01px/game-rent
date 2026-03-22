import magic
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from core.responses import api_error, api_response
from .selectors import get_favorites_ids, get_profile, get_token_info
from .serializers import (
    ConfirmChangeSerializer,
    FavoriteSerializer,
    ForgotPasswordSerializer,
    RegisterSerializer,
    RequestEmailChangeSerializer,
    UpdateUsernameSerializer,
)
from .services import (
    add_favorite,
    confirm_email_change,
    confirm_email_verification,
    confirm_new_email,
    confirm_password_change,
    forgot_password,
    register_user,
    remove_favorite,
    request_email_change,
    request_password_change,
    send_verification_email,
    update_username,
    upload_avatar,
)

from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


# Throttle Security

class AuthThrottle(AnonRateThrottle):
    scope = 'auth'

class EmailSpamThrottle(AnonRateThrottle):
    scope = 'email_spam'
# ─── AUTH ─────────────────────────────────────────────────────────────────────

class RegisterView(APIView):
    """Registra um novo usuário e retorna tokens JWT."""

    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user, tokens = register_user(
            username=serializer.validated_data["username"],
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )

        return api_response(
            data={
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "avatar": None,
                    "is_verified": False,
                },
                "tokens": tokens,
            },
            status_code=status.HTTP_201_CREATED,
        )


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Estende o serializer JWT para aceitar email como login e verificar o email."""

    def validate(self, attrs: dict) -> dict:
        username = attrs.get("username", "")
        if "@" in username:
            try:
                user = User.objects.get(email=username)
                attrs["username"] = user.username
            except User.DoesNotExist:
                pass

        data = super().validate(attrs)

        profile = getattr(self.user, "profile", None)
        if profile and not profile.is_verified and not self.user.is_staff:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                {"non_field_errors": ["Por favor, verifique seu email antes de fazer login."]}
            )

        avatar_url = None
        if profile and profile.avatar:
            req = self.context.get("request")
            if req:
                avatar_url = req.build_absolute_uri(profile.avatar.url)

        data["user"] = {
            "id": self.user.id,
            "username": self.user.username,
            "email": self.user.email,
            "avatar": avatar_url,
            "is_verified": profile.is_verified if profile else False,
            "is_staff": self.user.is_staff,
        }
        return data


class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [AuthThrottle]


# ─── PROFILE ──────────────────────────────────────────────────────────────────

class ProfileView(APIView):
    """Retorna os dados do perfil do usuário autenticado."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        user = request.user
        profile = get_profile(user)
        avatar_url = None
        if profile and profile.avatar:
            avatar_url = request.build_absolute_uri(profile.avatar.url)

        return api_response(data={
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "avatar": avatar_url,
            "is_verified": profile.is_verified if profile else False,
            "is_staff": user.is_staff,
        })


class CheckUsernameView(APIView):
    """Verifica se um username está disponível."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        username = request.query_params.get("username", "").strip()
        if not username:
            return api_error(
                code="MISSING_FIELD",
                message="O campo username é obrigatório.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        if username == request.user.username:
            return api_response(data={"available": True})

        available = not User.objects.filter(username=username).exists()
        return api_response(data={"available": available})


class UpdateUsernameView(APIView):
    """Atualiza o username do usuário autenticado."""

    permission_classes = [IsAuthenticated]

    def patch(self, request: Request) -> Response:
        serializer = UpdateUsernameSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        user = update_username(
            user=request.user,
            new_username=serializer.validated_data["username"],
        )
        return api_response(data={"username": user.username})


class AvatarUploadView(APIView):
    """Faz upload ou substitui o avatar do usuário autenticado."""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request: Request) -> Response:
        image = request.FILES.get("avatar")
        if not image:
            return api_error(
                code="MISSING_FILE",
                message="Nenhum arquivo enviado.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        # 1. Validação de Tamanho (Máximo de 2MB)
        if image.size > 2 * 1024 * 1024:
            return api_error(
                code="FILE_TOO_LARGE",
                message="A imagem deve ter no máximo 2MB.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # 2. Validação de Tipo de Arquivo (Magic Bytes)
        file_header = image.read(2048)
        image.seek(0)  # Retorna o ponteiro para o início para salvar depois
        mime_type = magic.from_buffer(file_header, mime=True)

        if mime_type not in ['image/jpeg', 'image/png', 'image/webp']:
            return api_error(
                code="INVALID_FILE_TYPE",
                message="Apenas imagens JPG, PNG ou WEBP são permitidas.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        profile = upload_avatar(user=request.user, image=image)
        return api_response(
            data={"avatar": request.build_absolute_uri(profile.avatar.url)}
        )


# ─── EMAIL CHANGE ─────────────────────────────────────────────────────────────

class RequestEmailChangeView(APIView):
    """Passo 1: inicia a troca de email enviando link para o email atual."""

    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = RequestEmailChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        request_email_change(
            user=request.user,
            new_email=serializer.validated_data["new_email"],
        )
        return api_response(
            data={"detail": "Link de confirmação enviado para o seu email atual."}
        )


# ─── PASSWORD CHANGE ──────────────────────────────────────────────────────────

class RequestPasswordChangeView(APIView):
    """Envia link de troca de senha para o email do usuário autenticado."""

    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        request_password_change(user=request.user)
        return api_response(
            data={"detail": "Link de redefinição de senha enviado para o seu email."}
        )


class ForgotPasswordView(APIView):
    """Envia link de reset de senha para o email informado (sem autenticação)."""

    permission_classes = [AllowAny]
    throttle_classes = [EmailSpamThrottle]

    def post(self, request: Request) -> Response:
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        forgot_password(email=serializer.validated_data["email"])

        return api_response(
            data={"detail": "Se este email estiver cadastrado, você receberá um link em breve."}
        )


# ─── CONFIRM CHANGE ───────────────────────────────────────────────────────────

class ConfirmChangeView(APIView):
    """GET: retorna info do token. POST: aplica a mudança conforme o tipo."""

    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        token_str = request.query_params.get("token")
        change_type = request.query_params.get("type")

        if not token_str or not change_type:
            return api_error(
                code="MISSING_PARAMS",
                message="Os parâmetros token e type são obrigatórios.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        token_obj = get_token_info(token_str, change_type)
        user = token_obj.user

        return api_response(data={
            "username": user.username,
            "current_email": user.email,
            "new_email": token_obj.new_value if change_type == "email" else None,
            "change_type": change_type,
        })

    def post(self, request: Request) -> Response:
        serializer = ConfirmChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token_str = serializer.validated_data["token"]
        change_type = serializer.validated_data["type"]

        if change_type == "verify":
            confirm_email_verification(token_str)
            return api_response(
                data={"detail": "Email verificado com sucesso! Bem-vindo ao GameRent!"}
            )

        if change_type == "email":
            if not serializer.validated_data.get("confirmed"):
                return api_error(
                    code="CONFIRMATION_REQUIRED",
                    message="Confirme a troca de email.",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
            new_email = confirm_email_change(token_str)
            return api_response(
                data={"detail": f"Link de verificação enviado para {new_email}."}
            )

        if change_type == "email_new":
            confirm_new_email(token_str)
            return api_response(
                data={"detail": "Email atualizado com sucesso!"}
            )

        if change_type == "password":
            new_password = serializer.validated_data.get("new_password")
            if not new_password:
                return api_error(
                    code="MISSING_FIELD",
                    message="O campo new_password é obrigatório.",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
            confirm_password_change(token_str, new_password)
            return api_response(data={"detail": "Senha atualizada com sucesso!"})


class ResendVerificationView(APIView):
    """Reenvia o email de verificação para o usuário autenticado."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [EmailSpamThrottle]

    def post(self, request: Request) -> Response:
        profile = get_profile(request.user)
        if profile and profile.is_verified:
            return api_error(
                code="ALREADY_VERIFIED",
                message="Email já verificado.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        send_verification_email(request.user)
        return api_response(data={"detail": "Email de verificação enviado."})


# ─── FAVORITES ────────────────────────────────────────────────────────────────

class FavoritesView(APIView):
    """Lista, adiciona e remove jogos favoritos do usuário."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        ids = list(get_favorites_ids(request.user))
        return api_response(data={"favorites": ids})

    def post(self, request: Request) -> Response:
        serializer = FavoriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        add_favorite(user=request.user, game_id=serializer.validated_data["game_id"])
        return api_response(data={"status": "added"}, status_code=status.HTTP_201_CREATED)

    def delete(self, request: Request) -> Response:
        serializer = FavoriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        remove_favorite(user=request.user, game_id=serializer.validated_data["game_id"])
        return api_response(data={"status": "removed"})
