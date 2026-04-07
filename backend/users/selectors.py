from django.contrib.auth.models import User
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import QuerySet

from core.exceptions import InvalidToken
from .models import Favorite, ProfileChangeToken, UserProfile

def get_profile(user: User) -> UserProfile | None:
    return getattr(user, "profile", None)

def get_token_info(token_str: str, change_type: str) -> ProfileChangeToken:
    try:
        return ProfileChangeToken.objects.select_related("user").get(
            token=token_str,
            change_type=change_type,
        )
    except (ProfileChangeToken.DoesNotExist, DjangoValidationError):
        raise InvalidToken()

def get_favorites_ids(user: User) -> QuerySet:
    return Favorite.objects.filter(user=user).values_list("game_id", flat=True)
