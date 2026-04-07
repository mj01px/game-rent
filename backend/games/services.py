import json
import uuid

from django.db import transaction

from .models import Game, GameKey, Publisher

def _resolve_publisher(publisher_name: str | None) -> Publisher | None:
    if not publisher_name or not publisher_name.strip():
        return None
    publisher, _ = Publisher.objects.get_or_create(name=publisher_name.strip())
    return publisher

def _get_publisher_by_id(publisher_id: str | int | None) -> Publisher | None:
    if not publisher_id:
        return None
    try:
        return Publisher.objects.get(pk=int(publisher_id))
    except (Publisher.DoesNotExist, ValueError, TypeError):
        return None

def _parse_genre(genre_raw: str | list | None) -> list:
    if genre_raw is None:
        return []
    if isinstance(genre_raw, list):
        return genre_raw
    try:
        return json.loads(genre_raw)
    except (json.JSONDecodeError, TypeError):
        return []

def _parse_bool(value: str | bool | None, default: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() == "true"
    return default

@transaction.atomic
def create_game(data: dict, image=None) -> Game:
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
    keys = [
        GameKey(game=game, key=str(uuid.uuid4()), status="available")
        for _ in range(quantity)
    ]
    return GameKey.objects.bulk_create(keys)

def delete_game(game: Game) -> None:
    game.delete()

def create_publisher(name: str) -> Publisher:
    if Publisher.objects.filter(name=name.strip()).exists():
        raise ValueError(f"Publisher '{name.strip()}' já existe.")
    return Publisher.objects.create(name=name.strip())

def update_publisher(publisher: Publisher, name: str) -> Publisher:
    if Publisher.objects.filter(name=name.strip()).exclude(pk=publisher.pk).exists():
        raise ValueError(f"Publisher '{name.strip()}' já existe.")
    publisher.name = name.strip()
    publisher.save()
    return publisher

def delete_publisher(publisher: Publisher) -> None:
    publisher.delete()
