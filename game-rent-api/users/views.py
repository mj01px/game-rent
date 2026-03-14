from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Favorite, ProfileChangeToken, UserProfile
import uuid
import re


def validate_password_strength(password):
    """Valida força da senha. Retorna (True, '') ou (False, mensagem de erro)."""
    if len(password) < 6:
        return False, 'Password must be at least 6 characters.'
    if not re.search(r'[A-Z]', password):
        return False, 'Password must contain at least one uppercase letter.'
    if not re.search(r'[a-z]', password):
        return False, 'Password must contain at least one lowercase letter.'
    if not re.search(r'[0-9]', password):
        return False, 'Password must contain at least one number.'
    if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-\[\]\\\/\+\=\~\`\;\'\&]', password):
        return False, 'Password must contain at least one special character (!@#$%^&* etc).'
    return True, ''


def send_verification_email(user, request=None):
    """Cria token de verificação e manda email para o usuário."""
    token = str(uuid.uuid4())
    ProfileChangeToken.objects.filter(user=user, change_type='verify').delete()
    ProfileChangeToken.objects.create(
        user=user,
        token=token,
        change_type='verify',
        new_value='',
    )
    confirm_url = f"{settings.FRONTEND_URL}/confirm-change?token={token}&type=verify"
    send_mail(
        subject='Verify your email — GameRent',
        message=(
            f"Hi {user.username},\n\n"
            f"Welcome to GameRent! Please verify your email address by clicking the link below:\n\n"
            f"{confirm_url}\n\n"
            f"If you didn't create this account, ignore this email.\n\n"
            f"— GameRent Team"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
    )


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')

        if not username or not email or not password:
            return Response({'error': 'Username, email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already taken.'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already in use.'}, status=status.HTTP_400_BAD_REQUEST)

        valid, msg = validate_password_strength(password)
        if not valid:
            return Response({'error': msg}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, email=email, password=password)
        UserProfile.objects.create(user=user, is_verified=False)

        try:
            send_verification_email(user, request)
        except Exception:
            pass

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'avatar': None,
                'is_verified': False,
            },
            'tokens': {'access': str(refresh.access_token), 'refresh': str(refresh)},
        }, status=status.HTTP_201_CREATED)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = getattr(user, 'profile', None)
        avatar_url = None
        if profile and profile.avatar:
            avatar_url = request.build_absolute_uri(profile.avatar.url)
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'avatar': avatar_url,
            'is_verified': profile.is_verified if profile else False,
            'is_staff': user.is_staff,
        })


class CheckUsernameView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        username = request.query_params.get('username', '').strip()
        if not username:
            return Response({'error': 'username is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if username == request.user.username:
            return Response({'available': True})
        available = not User.objects.filter(username=username).exists()
        return Response({'available': available})


class UpdateUsernameView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        username = request.data.get('username', '').strip()
        if not username:
            return Response({'error': 'username is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if username == request.user.username:
            return Response({'error': 'This is already your username.'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already taken.'}, status=status.HTTP_400_BAD_REQUEST)
        request.user.username = username
        request.user.save()
        return Response({'username': request.user.username})


class AvatarUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        avatar = request.FILES.get('avatar')
        if not avatar:
            return Response({'error': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)
        profile = getattr(request.user, 'profile', None)
        if not profile:
            profile = UserProfile.objects.create(user=request.user)
        profile.avatar = avatar
        profile.save()
        avatar_url = request.build_absolute_uri(profile.avatar.url)
        return Response({'avatar': avatar_url})


class RequestEmailChangeView(APIView):
    """
    Passo 1: usuário informa novo email.
    Manda link de confirmação para o EMAIL ATUAL.
    O link leva para uma tela que mostra de/para e pede confirmação.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        new_email = request.data.get('new_email', '').strip()
        if not new_email:
            return Response({'error': 'new_email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=new_email).exists():
            return Response({'error': 'Email already in use.'}, status=status.HTTP_400_BAD_REQUEST)

        token = str(uuid.uuid4())
        ProfileChangeToken.objects.filter(user=request.user, change_type='email').delete()
        ProfileChangeToken.objects.create(
            user=request.user,
            token=token,
            change_type='email',
            new_value=new_email,
        )

        confirm_url = f"{settings.FRONTEND_URL}/confirm-change?token={token}&type=email"
        send_mail(
            subject='Confirm your email change — GameRent',
            message=(
                f"Hi {request.user.username},\n\n"
                f"You requested to change your email.\n\n"
                f"Current email: {request.user.email}\n"
                f"New email: {new_email}\n\n"
                f"Click the link below to review and confirm this change:\n{confirm_url}\n\n"
                f"If you didn't request this, ignore this email.\n\n"
                f"— GameRent Team"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[request.user.email],
        )
        return Response({'detail': 'Confirmation email sent to your current email address.'})


class RequestPasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = str(uuid.uuid4())
        ProfileChangeToken.objects.filter(user=request.user, change_type='password').delete()
        ProfileChangeToken.objects.create(
            user=request.user,
            token=token,
            change_type='password',
            new_value='',
        )
        confirm_url = f"{settings.FRONTEND_URL}/confirm-change?token={token}&type=password"
        send_mail(
            subject='Change your password — GameRent',
            message=(
                f"Hi {request.user.username},\n\n"
                f"You requested to change your password.\n\n"
                f"Click the link below to proceed:\n{confirm_url}\n\n"
                f"If you didn't request this, ignore this email.\n\n"
                f"— GameRent Team"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[request.user.email],
        )
        return Response({'detail': 'Password reset link sent to your email.'})


class ForgotPasswordView(APIView):
    """Envia link de reset de senha para o email informado. Sem precisar estar logado."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        if not email:
            return Response({'error': 'email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Sempre retorna sucesso para não vazar se email existe ou não
        try:
            user = User.objects.get(email=email)
            token = str(uuid.uuid4())
            ProfileChangeToken.objects.filter(user=user, change_type='password').delete()
            ProfileChangeToken.objects.create(
                user=user,
                token=token,
                change_type='password',
                new_value='',
            )
            confirm_url = f"{settings.FRONTEND_URL}/confirm-change?token={token}&type=password"
            send_mail(
                subject='Reset your password — GameRent',
                message=(
                    f"Hi {user.username},\n\n"
                    f"You requested to reset your password.\n\n"
                    f"Click the link below to set a new password:\n{confirm_url}\n\n"
                    f"If you didn't request this, ignore this email.\n\n"
                    f"— GameRent Team"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
            )
        except User.DoesNotExist:
            pass  # Não revela se o email existe

        return Response({'detail': 'If this email is registered, you will receive a reset link shortly.'})


class ConfirmChangeView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        """
        GET: retorna info do token sem aplicar mudança.
        Usado pelo frontend para mostrar a tela de confirmação de email (de/para).
        """
        token_str = request.query_params.get('token')
        change_type = request.query_params.get('type')

        if not token_str or not change_type:
            return Response({'error': 'token and type are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token_obj = ProfileChangeToken.objects.get(token=token_str, change_type=change_type)
        except ProfileChangeToken.DoesNotExist:
            return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)

        user = token_obj.user
        return Response({
            'username': user.username,
            'current_email': user.email,
            'new_email': token_obj.new_value if change_type == 'email' else None,
            'change_type': change_type,
        })

    def post(self, request):
        token_str = request.data.get('token')
        change_type = request.data.get('type')
        new_password = request.data.get('new_password')
        confirmed = request.data.get('confirmed', False)  # Para email: usuário confirmou na tela

        if not token_str or not change_type:
            return Response({'error': 'token and type are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token_obj = ProfileChangeToken.objects.get(token=token_str, change_type=change_type)
        except ProfileChangeToken.DoesNotExist:
            return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)

        user = token_obj.user

        if change_type == 'verify':
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.is_verified = True
            profile.save()
            token_obj.delete()
            return Response({'detail': 'Email verified successfully. Welcome to GameRent!'})

        elif change_type == 'email':
            if not confirmed:
                return Response({'error': 'Please confirm the email change.'}, status=status.HTTP_400_BAD_REQUEST)

            new_email = token_obj.new_value

            # Passo 2: manda email de verificação para o NOVO email
            verify_token = str(uuid.uuid4())
            ProfileChangeToken.objects.filter(user=user, change_type='email_new').delete()
            ProfileChangeToken.objects.create(
                user=user,
                token=verify_token,
                change_type='email_new',
                new_value=new_email,
            )
            token_obj.delete()

            confirm_url = f"{settings.FRONTEND_URL}/confirm-change?token={verify_token}&type=email_new"
            send_mail(
                subject='Verify your new email — GameRent',
                message=(
                    f"Hi {user.username},\n\n"
                    f"Please verify your new email address by clicking the link below:\n\n"
                    f"{confirm_url}\n\n"
                    f"If you didn't request this, ignore this email.\n\n"
                    f"— GameRent Team"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[new_email],
            )
            return Response({'detail': f'A verification link has been sent to {new_email}. Click it to complete the email change.'})

        elif change_type == 'email_new':
            # Passo 3: usuário clicou no link do novo email — aplica a mudança
            user.email = token_obj.new_value
            user.save()
            token_obj.delete()
            return Response({'detail': 'Email updated successfully! You can now log in with your new email.'})

        elif change_type == 'password':
            if not new_password:
                return Response({'error': 'new_password is required.'}, status=status.HTTP_400_BAD_REQUEST)
            valid, msg = validate_password_strength(new_password)
            if not valid:
                return Response({'error': msg}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(new_password)
            user.save()
            token_obj.delete()
            return Response({'detail': 'Password updated successfully!'})

        return Response({'error': 'Unknown change type.'}, status=status.HTTP_400_BAD_REQUEST)


class ResendVerificationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile = getattr(request.user, 'profile', None)
        if profile and profile.is_verified:
            return Response({'error': 'Email already verified.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            send_verification_email(request.user, request)
        except Exception:
            return Response({'error': 'Failed to send email.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({'detail': 'Verification email sent.'})


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username = attrs.get('username')
        if '@' in str(username):
            try:
                user = User.objects.get(email=username)
                attrs['username'] = user.username
            except User.DoesNotExist:
                pass

        data = super().validate(attrs)

        profile = getattr(self.user, 'profile', None)
        if profile and not profile.is_verified:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'non_field_errors': ['Please verify your email before logging in.']})

        avatar_url = None
        if profile and profile.avatar:
            request = self.context.get('request')
            if request:
                avatar_url = request.build_absolute_uri(profile.avatar.url)

        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'avatar': avatar_url,
            'is_verified': profile.is_verified if profile else False,
            'is_staff': self.user.is_staff,
        }
        return data


class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class FavoritesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ids = list(Favorite.objects.filter(user=request.user).values_list('game_id', flat=True))
        return Response({'favorites': ids})

    def post(self, request):
        game_id = request.data.get('game_id')
        if not game_id:
            return Response({'error': 'game_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        Favorite.objects.get_or_create(user=request.user, game_id=game_id)
        return Response({'status': 'added'}, status=status.HTTP_201_CREATED)

    def delete(self, request):
        game_id = request.data.get('game_id')
        if not game_id:
            return Response({'error': 'game_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        Favorite.objects.filter(user=request.user, game_id=game_id).delete()
        return Response({'status': 'removed'})