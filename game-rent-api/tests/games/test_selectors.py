import pytest
from django.test.utils import CaptureQueriesContext
from django.db import connection

from core.exceptions import GameNotFound, NoKeysAvailable
from games.selectors import get_available_key, get_game_by_id, get_game_list
from tests.conftest import GameFactory, GameKeyFactory, PublisherFactory


@pytest.mark.django_db
class TestGetGameList:
    def test_returns_all_games_by_default(self, db):
        GameFactory.create_batch(3)

        qs = get_game_list()

        assert qs.count() == 3

    def test_filters_by_platform(self, db):
        GameFactory(platform="pc")
        GameFactory(platform="xbox")

        qs = get_game_list(platform="pc")

        assert qs.count() == 1
        assert qs.first().platform == "pc"

    def test_filters_featured(self, db):
        GameFactory(is_featured=True, rating=4.8)
        GameFactory(is_featured=False, rating=3.0)

        qs = get_game_list(featured="true")

        assert qs.count() == 1
        assert qs.first().is_featured is True

    def test_filters_by_publisher(self, db):
        pub = PublisherFactory()
        GameFactory(publisher=pub)
        GameFactory()

        qs = get_game_list(publisher_id=str(pub.pk))

        assert qs.count() == 1
        assert qs.first().publisher_id == pub.pk

    def test_no_n_plus_one_for_publisher(self, db):
        GameFactory.create_batch(5)

        with CaptureQueriesContext(connection) as ctx:
            list(get_game_list())

        # 1 query para games+publisher (select_related) + 1 para keys (prefetch_related)
        # Sem prefetch seria N+1 — com prefetch são sempre 2 independente do volume
        assert len(ctx.captured_queries) == 2


@pytest.mark.django_db
class TestGetGameById:
    def test_returns_game_by_id(self, game):
        result = get_game_by_id(game.pk)

        assert result.pk == game.pk

    def test_raises_not_found_for_missing_id(self, db):
        with pytest.raises(GameNotFound):
            get_game_by_id(99999)

    def test_loads_publisher_and_keys_without_extra_queries(self, game):
        with CaptureQueriesContext(connection) as ctx:
            result = get_game_by_id(game.pk)
            _ = result.publisher.name  # select_related — sem query extra
            _ = list(result.keys.all())  # prefetch_related — sem query extra

        # 1 query para game+publisher + 1 para keys via prefetch_related
        assert len(ctx.captured_queries) == 2


@pytest.mark.django_db
class TestGetAvailableKey:
    def test_returns_available_key(self, game_with_keys):
        key = get_available_key(game_with_keys)

        assert key.status == "available"
        assert key.game_id == game_with_keys.pk

    def test_raises_when_no_keys_available(self, game):
        GameKeyFactory(game=game, status="rented")

        with pytest.raises(NoKeysAvailable):
            get_available_key(game)

    def test_raises_when_game_has_no_keys(self, game):
        with pytest.raises(NoKeysAvailable):
            get_available_key(game)
