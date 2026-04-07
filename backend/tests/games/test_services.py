import pytest
from games.models import Game, GameKey
from games.services import add_game_keys, create_game, delete_game, update_game
from tests.conftest import GameFactory, PublisherFactory

@pytest.mark.django_db
class TestCreateGame:
    def test_creates_game_with_required_fields(self):
        game = create_game({"name": "Hollow Knight", "rental_price": "9.99", "rating": "4.5"})

        assert game.pk is not None
        assert game.name == "Hollow Knight"
        assert float(game.rental_price) == 9.99

    def test_creates_game_with_keys(self):
        game = create_game({"name": "Celeste", "rental_price": "7.99", "rating": "4.8", "keys_to_add": "5"})

        assert game.keys.count() == 5
        assert game.keys.filter(status="available").count() == 5

    def test_resolves_publisher_by_name(self):
        game = create_game({"name": "Dark Souls", "rental_price": "20.00", "rating": "4.9", "publisher_name": "FromSoftware"})

        assert game.publisher is not None
        assert game.publisher.name == "FromSoftware"

    def test_reuses_existing_publisher(self):
        pub = PublisherFactory(name="Nintendo")
        game = create_game({"name": "Zelda", "rental_price": "15.00", "rating": "4.7", "publisher_name": "Nintendo"})

        assert game.publisher.pk == pub.pk

    def test_parses_genre_from_json_string(self):
        game = create_game({"name": "RPG Game", "rental_price": "10.00", "rating": "4.0", "genre": '["RPG", "Adventure"]'})

        assert game.genre == ["RPG", "Adventure"]

    def test_featured_cleared_when_rating_below_threshold(self):
        game = create_game({"name": "Low Rated", "rental_price": "5.00", "rating": "3.0", "is_featured": "true"})

        assert game.is_featured is False

    def test_featured_kept_when_rating_above_threshold(self):
        game = create_game({"name": "Top Game", "rental_price": "15.00", "rating": "4.8", "is_featured": "true"})

        assert game.is_featured is True

    def test_creates_game_without_publisher(self):
        game = create_game({"name": "Indie Game", "rental_price": "5.00", "rating": "4.0"})

        assert game.publisher is None

@pytest.mark.django_db
class TestUpdateGame:
    def test_updates_name(self, game):
        updated = update_game(game, {"name": "New Name"})

        assert updated.name == "New Name"

    def test_updates_rating_and_enforces_featured_rule(self, game):
        game.is_featured = True
        game.rating = 4.8
        game.save()

        updated = update_game(game, {"rating": "3.0", "is_featured": "true"})

        assert float(updated.rating) == 3.0
        assert updated.is_featured is False

    def test_adds_keys_on_update(self, game):
        update_game(game, {"keys_to_add": "4"})

        assert game.keys.count() == 4

    def test_partial_update_leaves_other_fields_unchanged(self, game):
        original_price = game.rental_price
        update_game(game, {"name": "Changed Only Name"})

        game.refresh_from_db()
        assert game.rental_price == original_price

@pytest.mark.django_db
class TestAddGameKeys:
    def test_creates_correct_number_of_keys(self, game):
        keys = add_game_keys(game, 3)

        assert len(keys) == 3
        assert game.keys.count() == 3

    def test_all_keys_are_available(self, game):
        add_game_keys(game, 5)

        assert game.keys.filter(status="available").count() == 5

    def test_keys_are_unique_uuids(self, game):
        add_game_keys(game, 10)

        key_values = list(game.keys.values_list("key", flat=True))
        assert len(key_values) == len(set(key_values))

@pytest.mark.django_db
class TestDeleteGame:
    def test_deletes_game_and_keys(self, game_with_keys):
        game_id = game_with_keys.pk
        delete_game(game_with_keys)

        assert not Game.objects.filter(pk=game_id).exists()
        assert not GameKey.objects.filter(game_id=game_id).exists()
