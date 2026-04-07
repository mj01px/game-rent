import json
import uuid

from django.db import transaction

from .models import Game, GameKey, Publisher

def _resolve_publisher(publisher_name: str | None) -> Publisher | None:
    """Busca ou cria um publisher pelo nome. Retorna None se nome vazio."""
    if not publisher_name or not publisher_name.strip():
        return None
    publisher, _ = Publisher.objects.get_or_create(name=publisher_name.strip())
    return publisher

def _get_publisher_by_id(publisher_id: str | int | None) -> Publisher | None:
    """Retorna Publisher pelo ID ou None se não encontrado/não fornecido."""
    if not publisher_id:
        return None
    try:
        return Publisher.objects.get(pk=int(publisher_id))
    except (Publisher.DoesNotExist, ValueError, TypeError):
        return None

def _parse_genre(genre_raw: str | list | None) -> list:
    """Converte genre de JSON string ou lista para list Python."""
    if genre_raw is None:
        return []
    if isinstance(genre_raw, list):
        return genre_raw
    try:
        return json.loads(genre_raw)
    except (json.JSONDecodeError, TypeError):
        return []

def _parse_bool(value: str | bool | None, default: bool = False) -> bool:
    """Converte string "true"/"false" (vinda de multipart) para bool."""
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() == "true"
    return default

@transaction.atomic
def create_game(data: dict, image=None) -> Game:
    """Cria um jogo com publisher resolvido e gera chaves iniciais.

    Args:
        data: campos do formulário (incluindo publisher_name, genre como JSON
              string, is_featured/is_new como string, keys_to_add como int).
        image: arquivo de imagem do request.FILES, ou None.

    Returns:
        Game recém-criado.
    """
    publisher = _get_publisher_by_id(data.get("publisher_id")) or _resolve_publisher(data.get("publisher_name"))

    game = Game(
        name=data["name"],
        description=data.get("description", ""),
        platform=data.get("platform", "pc"),
        original_price=float(data.get("original_price") or 0),
        rental_price=float(data.get("rental_price") or 0),
        rating=float(data.get("rating") or 0),
        release_date=data.get("release_date") or None,
        genre=_parse_genre(data.get("genre")),
        is_featured=_parse_bool(data.get("is_featured")),
        is_new=_parse_bool(data.get("is_new")),
        publisher=publisher,
    )

    if image:
        game.image = image

    game.save()

    keys_to_add = int(data.get("keys_to_add", 0))
    if keys_to_add > 0:
        add_game_keys(game, keys_to_add)

    return game

@transaction.atomic
def update_game(game: Game, data: dict, image=None) -> Game:
    """Atualiza campos de um jogo existente (PATCH semântico).

    Apenas campos presentes em data são alterados.
    """
    if data.get("publisher_id"):
        game.publisher = _get_publisher_by_id(data["publisher_id"])
    elif data.get("publisher_name", "").strip():
        game.publisher = _resolve_publisher(data["publisher_name"])

    genre_raw = data.get("genre")
    if genre_raw is not None:
        game.genre = _parse_genre(genre_raw)

    if data.get("name"):
        game.name = data["name"]
    if data.get("description") is not None:
        game.description = data["description"]
    if data.get("platform"):
        game.platform = data["platform"]
    if data.get("original_price"):
        game.original_price = float(data["original_price"])
    if data.get("rental_price"):
        game.rental_price = float(data["rental_price"])
    if data.get("rating"):
        game.rating = float(data["rating"])
    if data.get("release_date"):
        game.release_date = data["release_date"]
    if "is_featured" in data:
        game.is_featured = _parse_bool(data["is_featured"], default=game.is_featured)
    if "is_new" in data:
        game.is_new = _parse_bool(data["is_new"], default=game.is_new)

    if image:
        game.image = image

    game.save()

    keys_to_add = int(data.get("keys_to_add", 0))
    if keys_to_add > 0:
        add_game_keys(game, keys_to_add)

    return game

def add_game_keys(game: Game, quantity: int) -> list[GameKey]:
    """Cria N chaves disponíveis para um jogo via bulk_create.

    Args:
        game: jogo ao qual as chaves serão associadas.
        quantity: número de chaves a criar.

    Returns:
        Lista de GameKeys criadas.
    """
    keys = [
        GameKey(game=game, key=str(uuid.uuid4()), status="available")
        for _ in range(quantity)
    ]
    return GameKey.objects.bulk_create(keys)

def delete_game(game: Game) -> None:
    """Remove um jogo e todas as suas chaves (CASCADE no model)."""
    game.delete()

def create_publisher(name: str) -> Publisher:
    """Cria um publisher com o nome fornecido.

    Raises:
        ValueError: se o nome já existir.
    """
    if Publisher.objects.filter(name=name.strip()).exists():
        raise ValueError(f"Publisher '{name.strip()}' já existe.")
    return Publisher.objects.create(name=name.strip())

def update_publisher(publisher: Publisher, name: str) -> Publisher:
    """Atualiza o nome de um publisher.

    Raises:
        ValueError: se outro publisher com esse nome já existir.
    """
    if Publisher.objects.filter(name=name.strip()).exclude(pk=publisher.pk).exists():
        raise ValueError(f"Publisher '{name.strip()}' já existe.")
    publisher.name = name.strip()
    publisher.save()
    return publisher

def delete_publisher(publisher: Publisher) -> None:
    """Remove um publisher (jogos vinculados ficam sem publisher)."""
    publisher.delete()
