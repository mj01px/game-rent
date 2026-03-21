from django.contrib.auth.models import User
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import QuerySet

from core.exceptions import InvalidToken
from .models import Favorite, ProfileChangeToken, UserProfile


def get_profile(user: User) -> UserProfile | None:
    """Retorna o perfil do usuário ou None se não existir."""
    return getattr(user, "profile", None)


def get_token_info(token_str: str, change_type: str) -> ProfileChangeToken:
    """Retorna um ProfileChangeToken válido pelo token string e tipo.

    Raises:
        InvalidToken: se o token não existir ou não corresponder ao tipo.
    """
    try:
        return ProfileChangeToken.objects.select_related("user").get(
            token=token_str,
            change_type=change_type,
        )
    except (ProfileChangeToken.DoesNotExist, DjangoValidationError):
        # DjangoValidationError ocorre quando token_str não é um UUID válido
        raise InvalidToken()


def get_favorites_ids(user: User) -> QuerySet:
    """Retorna os IDs dos jogos favoritos do usuário."""
    return Favorite.objects.filter(user=user).values_list("game_id", flat=True)
