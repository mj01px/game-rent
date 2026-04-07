from django.db.models import QuerySet

from core.exceptions import GameNotFound, NoKeysAvailable
from .models import Game, GameKey

def get_game_list(
    platform: str | None = None,
    featured: str | None = None,
    publisher_id: str | None = None,
) -> QuerySet[Game]:
    """Retorna queryset de jogos com filtros opcionais.

    Sempre usa select_related/prefetch_related para evitar N+1.
    Filtros de busca e ordenação são aplicados pelo DRF na view.
    """
    queryset = Game.objects.select_related("publisher").prefetch_related("keys")

    if platform:
        queryset = queryset.filter(platform=platform)
    if featured == "true":
        queryset = queryset.filter(is_featured=True)
    if publisher_id:
        queryset = queryset.filter(publisher__id=publisher_id)

    return queryset

def get_game_by_id(game_id: int) -> Game:
    """Retorna um jogo pelo ID com publisher e keys carregados.

    Raises:
        GameNotFound: se o jogo não existir.
    """
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
    """Retorna a primeira chave disponível de um jogo.

    Raises:
        NoKeysAvailable: se não houver chaves disponíveis.
    """
    key = game.keys.filter(status="available").first()
    if key is None:
        raise NoKeysAvailable()
    return key
