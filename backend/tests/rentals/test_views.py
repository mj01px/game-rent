import pytest
from tests.conftest import GameKeyFactory, RentalFactory, RefundRequestFactory, UserFactory

@pytest.mark.django_db
class TestRentalListView:
    URL = "/api/rentals/"

    def test_requires_authentication(self, api_client):
        response = api_client.get(self.URL)
        assert response.status_code == 401

    def test_returns_only_user_rentals(self, auth_client, user, game_with_keys):
        other = UserFactory()
        key1 = game_with_keys.keys.filter(status="available").first()
        key1.status = "rented"
        key1.save()
        RentalFactory(user=user, game_key=key1)

        key2 = GameKeyFactory(game=game_with_keys)
        RentalFactory(user=other, game_key=key2)

        response = auth_client.get(self.URL)

        assert response.status_code == 200
        assert len(response.data["data"]) == 1

@pytest.mark.django_db
class TestCreateRentalView:
    URL = "/api/rentals/create/"

    def test_requires_authentication(self, api_client, game_with_keys):
        response = api_client.post(self.URL, {"game_id": game_with_keys.pk, "rental_days": 7})
        assert response.status_code == 401

    def test_creates_rental_successfully(self, auth_client, game_with_keys):
        response = auth_client.post(self.URL, {
            "game_id": game_with_keys.pk,
            "rental_days": 7,
        })

        assert response.status_code == 201
        assert response.data["data"]["status"] == "active"

    def test_returns_key_value_for_active_rental(self, auth_client, game_with_keys):
        response = auth_client.post(self.URL, {
            "game_id": game_with_keys.pk,
            "rental_days": 1,
        })

        assert response.data["data"]["game_key_value"] is not None

    def test_rejects_invalid_game_id(self, auth_client, db):
        response = auth_client.post(self.URL, {"game_id": 99999, "rental_days": 7})

        assert response.status_code == 400

    def test_rejects_rental_days_out_of_range(self, auth_client, game_with_keys):
        response = auth_client.post(self.URL, {"game_id": game_with_keys.pk, "rental_days": 0})
        assert response.status_code == 400

        response = auth_client.post(self.URL, {"game_id": game_with_keys.pk, "rental_days": 31})
        assert response.status_code == 400

    def test_returns_409_when_no_keys(self, auth_client, game):
        response = auth_client.post(self.URL, {"game_id": game.pk, "rental_days": 7})

        assert response.status_code == 409

@pytest.mark.django_db
class TestRequestRefundView:
    def url(self, pk):
        return f"/api/rentals/{pk}/refund/"

    def test_creates_refund_request(self, auth_client, rental):
        response = auth_client.post(self.url(rental.pk), {"reason": "Não gostei"})

        assert response.status_code == 201

    def test_rejects_duplicate_refund(self, auth_client, rental):
        auth_client.post(self.url(rental.pk), {"reason": "Primeira"})
        response = auth_client.post(self.url(rental.pk), {"reason": "Segunda"})

        assert response.status_code == 409

    def test_returns_404_for_other_users_rental(self, api_client, db, game_with_keys):
        other = UserFactory()
        key = game_with_keys.keys.filter(status="available").first()
        key.status = "rented"
        key.save()
        rental = RentalFactory(user=other, game_key=key)

        from tests.conftest import UserFactory as UF
        user = UF()
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

        response = api_client.post(self.url(rental.pk), {"reason": "X"})
        assert response.status_code == 404

@pytest.mark.django_db
class TestAdminRefundActionView:
    def url(self, pk):
        return f"/api/rentals/admin/refunds/{pk}/action/"

    def test_approve_refund(self, admin_client, rental):
        refund = RefundRequestFactory(rental=rental, user=rental.user)

        response = admin_client.post(self.url(refund.pk), {"action": "approve"})

        assert response.status_code == 200
        rental.refresh_from_db()
        assert rental.status == "expired"

    def test_reject_refund(self, admin_client, rental):
        refund = RefundRequestFactory(rental=rental, user=rental.user)

        response = admin_client.post(self.url(refund.pk), {"action": "reject"})

        assert response.status_code == 200

    def test_invalid_action_returns_400(self, admin_client, rental):
        refund = RefundRequestFactory(rental=rental, user=rental.user)

        response = admin_client.post(self.url(refund.pk), {"action": "cancel"})

        assert response.status_code == 400

    def test_requires_admin(self, auth_client, rental):
        refund = RefundRequestFactory(rental=rental, user=rental.user)

        response = auth_client.post(self.url(refund.pk), {"action": "approve"})
        assert response.status_code == 403

@pytest.mark.django_db
class TestAdminUserListView:
    URL = "/api/rentals/admin/users/"

    def test_requires_admin(self, auth_client):
        response = auth_client.get(self.URL)
        assert response.status_code == 403

    def test_returns_users_with_rental_count(self, admin_client, user, rental):
        response = admin_client.get(self.URL)

        assert response.status_code == 200
        users = response.data["data"]
        target = next((u for u in users if u["username"] == user.username), None)
        assert target is not None
        assert target["rental_count"] >= 1
