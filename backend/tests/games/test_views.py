import pytest
from tests.conftest import GameFactory, GameKeyFactory


@pytest.mark.django_db
class TestGameListView:
    URL = "/api/games/"

    def test_public_access(self, api_client):
        response = api_client.get(self.URL)
        assert response.status_code == 200

    def test_returns_envelope(self, api_client, game):
        response = api_client.get(self.URL)
        assert "data" in response.data
        assert "error" in response.data
        assert "meta" in response.data

    def test_filter_by_platform(self, api_client, db):
        GameFactory(platform="pc")
        GameFactory(platform="xbox")

        response = api_client.get(self.URL, {"platform": "pc"})

        assert response.status_code == 200
        results = response.data["data"]
        assert all(g["platform"] == "pc" for g in results)

    def test_search_by_name(self, api_client, db):
        GameFactory(name="Hollow Knight")
        GameFactory(name="Celeste")

        response = api_client.get(self.URL, {"search": "Hollow"})

        assert response.status_code == 200
        assert len(response.data["data"]) == 1
        assert response.data["data"][0]["name"] == "Hollow Knight"


@pytest.mark.django_db
class TestGameDetailView:
    def url(self, pk):
        return f"/api/games/{pk}/"

    def test_public_access(self, api_client, game):
        response = api_client.get(self.url(game.pk))
        assert response.status_code == 200

    def test_returns_envelope(self, api_client, game):
        response = api_client.get(self.url(game.pk))
        assert "data" in response.data
        assert response.data["error"] is None

    def test_returns_404_for_missing_game(self, api_client, db):
        response = api_client.get(self.url(99999))
        assert response.status_code == 404

    def test_available_keys_count(self, api_client, game):
        GameKeyFactory.create_batch(3, game=game, status="available")
        GameKeyFactory(game=game, status="rented")

        response = api_client.get(self.url(game.pk))

        assert response.data["data"]["available_keys"] == 3


@pytest.mark.django_db
class TestAdminGameCreateView:
    URL = "/api/games/admin/create/"

    def test_requires_admin(self, auth_client):
        response = auth_client.post(self.URL, {"name": "X"})
        assert response.status_code == 403

    def test_unauthenticated_denied(self, api_client):
        response = api_client.post(self.URL, {"name": "X"})
        assert response.status_code == 401

    def test_admin_creates_game(self, admin_client):
        response = admin_client.post(self.URL, {
            "name": "New Game",
            "platform": "pc",
            "rental_price": "12.99",
            "rating": "4.5",
            "keys_to_add": "3",
        })

        assert response.status_code == 201
        assert response.data["data"]["name"] == "New Game"
        assert response.data["data"]["available_keys"] == 3


@pytest.mark.django_db
class TestAdminGameDetailView:
    def url(self, pk):
        return f"/api/games/admin/{pk}/"

    def test_patch_updates_game(self, admin_client, game):
        response = admin_client.patch(self.url(game.pk), {"name": "Updated Name"})

        assert response.status_code == 200
        assert response.data["data"]["name"] == "Updated Name"

    def test_delete_removes_game(self, admin_client, game):
        response = admin_client.delete(self.url(game.pk))

        assert response.status_code == 204

    def test_patch_nonexistent_returns_404(self, admin_client, db):
        response = admin_client.patch(self.url(99999), {"name": "X"})

        assert response.status_code == 404

    def test_requires_admin(self, auth_client, game):
        response = auth_client.delete(self.url(game.pk))
        assert response.status_code == 403
