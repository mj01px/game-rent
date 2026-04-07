from django.db.models import QuerySet

from core.exceptions import GameNotFound, NoKeysAvailable
from .models import Game, GameKey

def get_game_list(
    platform: str | None = None,
    featured: str | None = None,
    publisher_id: str | None = None,
) -> QuerySet[Game]:
    queryset = Game.objects.select_related("publisher").prefetch_related("keys")

    if platform:
        queryset = queryset.filter(platform=platform)
    if featured == "true":
        queryset = queryset.filter(is_featured=True)
    if publisher_id:
        queryset = queryset.filter(publisher__id=publisher_id)

    return queryset

def get_game_by_id(game_id: int) -> Game:
    try:
        return (
            Game.objects
            .select_related("publisher")
            .prefetch_related("keys")
            .get(pk=game_id)
        )
    except Game.DoesNotExist:
        raise GameNotFound()

def get_available_key(game: Game) -> GameKey:
    key = game.keys.filter(status="available").first()
    if key is None:
        raise NoKeysAvailable()
    return key
