import uuid

from django.conf import settings
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.db import transaction
from rest_framework_simplejwt.tokens import RefreshToken

from core.exceptions import EmailAlreadyInUse, UsernameAlreadyInUse
from core.validators import validate_password_strength
from .models import Favorite, ProfileChangeToken, UserProfile
from .selectors import get_token_info


# ---------------------------------------------------------------------------
# Helpers internos
# ---------------------------------------------------------------------------

def _create_token(user: User, change_type: str, new_value: str = "") -> str:
    """Cria (ou substitui) um ProfileChangeToken e retorna o token string."""
    token = str(uuid.uuid4())
    ProfileChangeToken.objects.filter(user=user, change_type=change_type).delete()
    ProfileChangeToken.objects.create(
        user=user,
        token=token,
        change_type=change_type,
        new_value=new_value,
    )
    return token


def _send_email(subject: str, message: str, recipient: str) -> None:
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[recipient],
    )


# ---------------------------------------------------------------------------
# Registro e verificação de email
# ---------------------------------------------------------------------------

@transaction.atomic
def register_user(username: str, email: str, password: str) -> tuple[User, dict]:
    """Cria um novo usuário com perfil e envia email de verificação.

    Args:
        username: nome de usuário desejado.
        email: email do usuário.
        password: senha em texto plano (será hasheada).

    Returns:
        Tupla (user, tokens) onde tokens contém "access" e "refresh".

    Raises:
        UsernameAlreadyInUse: se o username já existe.
        EmailAlreadyInUse: se o email já está em uso.
        DjangoValidationError: se a senha não atende aos requisitos.
    """
    if User.objects.filter(username=username).exists():
        raise UsernameAlreadyInUse()
    if User.objects.filter(email=email).exists():
        raise EmailAlreadyInUse()

    validate_password_strength(password)

    user = User.objects.create_user(username=username, email=email, password=password)
    UserProfile.objects.create(user=user, is_verified=False)

    try:
        send_verification_email(user)
    except Exception:
        pass  # Não bloqueia o registro se o envio de email falhar

    refresh = RefreshToken.for_user(user)
    return user, {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


def send_verification_email(user: User) -> None:
    """Cria token de verificação de email e envia o link para o usuário."""
    token = _create_token(user, "verify")
    confirm_url = f"{settings.FRONTEND_URL}/confirm-change?token={token}&type=verify"
    _send_email(
        subject="Verify your email — GameRent",
        message=(
            f"Hi {user.username},\n\n"
            f"Welcome to GameRent! Please verify your email address:\n\n"
            f"{confirm_url}\n\n"
            f"If you didn't create this account, ignore this email.\n\n"
            f"— GameRent Team"
        ),
        recipient=user.email,
    )


def confirm_email_verification(token_str: str) -> None:
    """Marca o email do usuário como verificado e apaga o token.

    Raises:
        InvalidToken: se o token não existir.
    """
    token_obj = get_token_info(token_str, "verify")
    profile, _ = UserProfile.objects.get_or_create(user=token_obj.user)
    profile.is_verified = True
    profile.save(update_fields=["is_verified"])
    token_obj.delete()


# ---------------------------------------------------------------------------
# Troca de email (fluxo em 2 etapas)
# ---------------------------------------------------------------------------

def request_email_change(user: User, new_email: str) -> None:
    """Passo 1: valida o novo email e envia link de confirmação para o email atual.

    Raises:
        EmailAlreadyInUse: se o novo email já está em uso.
    """
    if User.objects.filter(email=new_email).exists():
        raise EmailAlreadyInUse()

    token = _create_token(user, "email", new_value=new_email)
    confirm_url = f"{settings.FRONTEND_URL}/confirm-change?token={token}&type=email"
    _send_email(
        subject="Confirm your email change — GameRent",
        message=(
            f"Hi {user.username},\n\n"
            f"You requested to change your email.\n\n"
            f"Current email: {user.email}\n"
            f"New email: {new_email}\n\n"
            f"Click the link to review and confirm:\n{confirm_url}\n\n"
            f"If you didn't request this, ignore this email.\n\n"
            f"— GameRent Team"
        ),
        recipient=user.email,
    )


def confirm_email_change(token_str: str) -> str:
    """Passo 2: usuário confirmou — envia link de verificação para o novo email.

    Returns:
        O novo email para o qual o link foi enviado.

    Raises:
        InvalidToken: se o token não existir.
    """
    token_obj = get_token_info(token_str, "email")
    new_email = token_obj.new_value

    verify_token = _create_token(token_obj.user, "email_new", new_value=new_email)
    token_obj.delete()

    confirm_url = (
        f"{settings.FRONTEND_URL}/confirm-change?token={verify_token}&type=email_new"
    )
    _send_email(
        subject="Verify your new email — GameRent",
        message=(
            f"Hi {token_obj.user.username},\n\n"
            f"Please verify your new email by clicking the link below:\n\n"
            f"{confirm_url}\n\n"
            f"If you didn't request this, ignore this email.\n\n"
            f"— GameRent Team"
        ),
        recipient=new_email,
    )
    return new_email


def confirm_new_email(token_str: str) -> None:
    """Passo 3: aplica efetivamente a troca de email.

    Raises:
        InvalidToken: se o token não existir.
    """
    token_obj = get_token_info(token_str, "email_new")
    user = token_obj.user
    user.email = token_obj.new_value
    user.save(update_fields=["email"])
    token_obj.delete()


# ---------------------------------------------------------------------------
# Troca e reset de senha
# ---------------------------------------------------------------------------

def request_password_change(user: User) -> None:
    """Envia link de troca de senha para o email do usuário autenticado."""
    token = _create_token(user, "password")
    confirm_url = f"{settings.FRONTEND_URL}/confirm-change?token={token}&type=password"
    _send_email(
        subject="Change your password — GameRent",
        message=(
            f"Hi {user.username},\n\n"
            f"You requested to change your password.\n\n"
            f"Click the link below to proceed:\n{confirm_url}\n\n"
            f"If you didn't request this, ignore this email.\n\n"
            f"— GameRent Team"
        ),
        recipient=user.email,
    )


def forgot_password(email: str) -> None:
    """Envia link de reset de senha para o email informado.

    Não revela se o email existe (proteção contra enumeração de contas).
    """
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return

    token = _create_token(user, "password")
    confirm_url = f"{settings.FRONTEND_URL}/confirm-change?token={token}&type=password"
    _send_email(
        subject="Reset your password — GameRent",
        message=(
            f"Hi {user.username},\n\n"
            f"You requested to reset your password.\n\n"
            f"Click the link below to set a new password:\n{confirm_url}\n\n"
            f"If you didn't request this, ignore this email.\n\n"
            f"— GameRent Team"
        ),
        recipient=user.email,
    )


def confirm_password_change(token_str: str, new_password: str) -> None:
    """Aplica a troca de senha após validar o token e a força da senha.

    Raises:
        InvalidToken: se o token não existir.
        DjangoValidationError: se a senha não atende aos requisitos.
    """
    token_obj = get_token_info(token_str, "password")
    validate_password_strength(new_password)
    user = token_obj.user
    user.set_password(new_password)
    user.save()
    token_obj.delete()


def send_password_reset_email(user: User) -> None:
    """Envia link de reset de senha para um usuário (acionado pelo admin).

    Movido de rentals/views.AdminSendPasswordResetView.
    """
    token = _create_token(user, "password")
    confirm_url = f"{settings.FRONTEND_URL}/confirm-change?token={token}&type=password"
    _send_email(
        subject="Reset your password — GameRent",
        message=(
            f"Hi {user.username},\n\n"
            f"An administrator has sent you a password reset link.\n\n"
            f"Click the link below to set a new password:\n{confirm_url}\n\n"
            f"— GameRent Team"
        ),
        recipient=user.email,
    )


# ---------------------------------------------------------------------------
# Perfil e avatar
# ---------------------------------------------------------------------------

def update_username(user: User, new_username: str) -> User:
    """Troca o username do usuário.

    Raises:
        UsernameAlreadyInUse: se o username já está em uso por outro usuário.
    """
    if User.objects.filter(username=new_username).exclude(pk=user.pk).exists():
        raise UsernameAlreadyInUse()
    user.username = new_username
    user.save(update_fields=["username"])
    return user


def upload_avatar(user: User, image) -> UserProfile:
    """Atualiza ou cria o avatar do usuário."""
    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.avatar = image
    profile.save(update_fields=["avatar"])
    return profile


# ---------------------------------------------------------------------------
# Favoritos
# ---------------------------------------------------------------------------

def add_favorite(user: User, game_id: int) -> None:
    """Adiciona um jogo aos favoritos do usuário (idempotente)."""
    Favorite.objects.get_or_create(user=user, game_id=game_id)


def remove_favorite(user: User, game_id: int) -> None:
    """Remove um jogo dos favoritos do usuário."""
    Favorite.objects.filter(user=user, game_id=game_id).delete()
