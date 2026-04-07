import pytest
from unittest.mock import patch

from users.models import ProfileChangeToken
from tests.conftest import ProfileChangeTokenFactory, UserFactory

@pytest.mark.django_db
class TestRegisterView:
    URL = "/api/users/register/"

    def test_registers_new_user(self, api_client, db):
        with patch("users.services.send_verification_email"):
            response = api_client.post(self.URL, {
                "username": "brandnew",
                "email": "brandnew@test.com",
                "password": "Test@1234",
            })

        assert response.status_code == 201
        assert response.data["data"]["user"]["username"] == "brandnew"
        assert "tokens" in response.data["data"]

    def test_returns_409_for_duplicate_username(self, api_client, db):
        UserFactory(username="existing")

        with patch("users.services.send_verification_email"):
            response = api_client.post(self.URL, {
                "username": "existing",
                "email": "new@test.com",
                "password": "Test@1234",
            })

        assert response.status_code == 409

    def test_returns_400_for_weak_password(self, api_client, db):
        response = api_client.post(self.URL, {
            "username": "weakuser",
            "email": "weak@test.com",
            "password": "weak",
        })

        assert response.status_code == 400

@pytest.mark.django_db
class TestLoginView:
    URL = "/api/users/login/"

    def test_login_with_username(self, api_client, db):
        user = UserFactory(username="loginuser")

        response = api_client.post(self.URL, {
            "username": "loginuser",
            "password": "Test@1234",
        })

        assert response.status_code == 200
        assert "access" in response.data

    def test_login_with_email(self, api_client, db):
        user = UserFactory(username="emaillogin", email="email@login.com")

        response = api_client.post(self.URL, {
            "username": "email@login.com",
            "password": "Test@1234",
        })

        assert response.status_code == 200

    def test_login_blocked_for_unverified_email(self, api_client, db):
        from django.contrib.auth.models import User
        from users.models import UserProfile

        user = User.objects.create_user(
            username="unverified", email="unv@test.com", password="Test@1234"
        )
        UserProfile.objects.create(user=user, is_verified=False)

        response = api_client.post(self.URL, {
            "username": "unverified",
            "password": "Test@1234",
        })

        assert response.status_code == 400

    def test_includes_user_data_in_response(self, api_client, db):
        UserFactory(username="withdata")

        response = api_client.post(self.URL, {
            "username": "withdata",
            "password": "Test@1234",
        })

        assert "user" in response.data
        assert response.data["user"]["username"] == "withdata"

@pytest.mark.django_db
class TestProfileView:
    URL = "/api/users/profile/"

    def test_requires_authentication(self, api_client):
        response = api_client.get(self.URL)
        assert response.status_code == 401

    def test_returns_user_profile(self, auth_client, user):
        response = auth_client.get(self.URL)

        assert response.status_code == 200
        assert response.data["data"]["username"] == user.username
        assert response.data["data"]["email"] == user.email

@pytest.mark.django_db
class TestUpdateUsernameView:
    URL = "/api/users/profile/update-username/"

    def test_updates_username(self, auth_client, user):
        response = auth_client.patch(self.URL, {"username": "updatedname"})

        assert response.status_code == 200
        assert response.data["data"]["username"] == "updatedname"

    def test_rejects_existing_username(self, auth_client, db):
        UserFactory(username="takenname")

        response = auth_client.patch(self.URL, {"username": "takenname"})

        assert response.status_code == 409

    def test_rejects_own_username(self, auth_client, user):
        response = auth_client.patch(self.URL, {"username": user.username})

        assert response.status_code == 400

@pytest.mark.django_db
class TestConfirmChangeView:
    URL = "/api/users/profile/confirm-change/"

    def test_get_returns_token_info(self, api_client, db):
        user = UserFactory()
        token = ProfileChangeTokenFactory(user=user, change_type="verify")

        response = api_client.get(self.URL, {"token": str(token.token), "type": "verify"})

        assert response.status_code == 200
        assert response.data["data"]["username"] == user.username

    def test_get_returns_400_for_invalid_token(self, api_client, db):
        response = api_client.get(self.URL, {
            "token": "00000000-0000-0000-0000-000000000000",
            "type": "verify",
        })

        assert response.status_code == 400

    def test_post_verifies_email(self, api_client, db):
        user = UserFactory()
        user.profile.is_verified = False
        user.profile.save()
        token = ProfileChangeTokenFactory(user=user, change_type="verify")

        response = api_client.post(self.URL, {
            "token": str(token.token),
            "type": "verify",
        })

        assert response.status_code == 200
        user.profile.refresh_from_db()
        assert user.profile.is_verified is True

    def test_post_password_change(self, api_client, db):
        user = UserFactory()
        token = ProfileChangeTokenFactory(user=user, change_type="password")

        response = api_client.post(self.URL, {
            "token": str(token.token),
            "type": "password",
            "new_password": "NewPass@99",
        })

        assert response.status_code == 200
        user.refresh_from_db()
        assert user.check_password("NewPass@99")

@pytest.mark.django_db
class TestFavoritesView:
    URL = "/api/users/favorites/"

    def test_requires_authentication(self, api_client):
        response = api_client.get(self.URL)
        assert response.status_code == 401

    def test_lists_empty_favorites(self, auth_client):
        response = auth_client.get(self.URL)

        assert response.status_code == 200
        assert response.data["data"]["favorites"] == []

    def test_add_favorite(self, auth_client):
        response = auth_client.post(self.URL, {"game_id": 42})

        assert response.status_code == 201

    def test_remove_favorite(self, auth_client):
        auth_client.post(self.URL, {"game_id": 42})
        response = auth_client.delete(self.URL, {"game_id": 42})

        assert response.status_code == 200

    def test_list_shows_added_favorites(self, auth_client):
        auth_client.post(self.URL, {"game_id": 10})
        auth_client.post(self.URL, {"game_id": 20})

        response = auth_client.get(self.URL)

        assert set(response.data["data"]["favorites"]) == {10, 20}

@pytest.mark.django_db
class TestForgotPasswordView:
    URL = "/api/users/forgot-password/"

    def test_always_returns_200(self, api_client, db):
        response = api_client.post(self.URL, {"email": "notexist@test.com"})
        assert response.status_code == 200

    def test_sends_email_when_user_exists(self, api_client, db):
        UserFactory(email="exists@test.com")

        with patch("users.services._send_email") as mock_email:
            api_client.post(self.URL, {"email": "exists@test.com"})

        mock_email.assert_called_once()
