import pytest
from unittest.mock import patch

from django.core.exceptions import ValidationError as DjangoValidationError

from core.exceptions import (
    EmailAlreadyInUse,
    InvalidToken,
    UsernameAlreadyInUse,
)
from users.models import ProfileChangeToken, UserProfile
from users.services import (
    add_favorite,
    confirm_email_verification,
    forgot_password,
    register_user,
    remove_favorite,
    request_email_change,
    update_username,
    upload_avatar,
)
from tests.conftest import ProfileChangeTokenFactory, UserFactory

@pytest.mark.django_db
class TestRegisterUser:
    def test_creates_user_and_profile(self, db):
        with patch("users.services.send_verification_email"):
            user, tokens = register_user("newuser", "new@test.com", "Test@1234")

        assert user.pk is not None
        assert UserProfile.objects.filter(user=user).exists()
        assert user.check_password("Test@1234")

    def test_returns_jwt_tokens(self, db):
        with patch("users.services.send_verification_email"):
            _, tokens = register_user("tokenuser", "token@test.com", "Test@1234")

        assert "access" in tokens
        assert "refresh" in tokens

    def test_profile_starts_unverified(self, db):
        with patch("users.services.send_verification_email"):
            user, _ = register_user("unverified", "unv@test.com", "Test@1234")

        assert user.profile.is_verified is False

    def test_raises_for_duplicate_username(self, db):
        UserFactory(username="taken")

        with patch("users.services.send_verification_email"):
            with pytest.raises(UsernameAlreadyInUse):
                register_user("taken", "other@test.com", "Test@1234")

    def test_raises_for_duplicate_email(self, db):
        UserFactory(email="taken@test.com")

        with patch("users.services.send_verification_email"):
            with pytest.raises(EmailAlreadyInUse):
                register_user("newuser2", "taken@test.com", "Test@1234")

    def test_raises_for_weak_password(self, db):
        with pytest.raises(DjangoValidationError):
            register_user("weakuser", "weak@test.com", "weak")

    def test_registration_succeeds_even_if_email_fails(self, db):
        with patch("users.services.send_verification_email", side_effect=Exception("SMTP down")):
            user, _ = register_user("resilient", "res@test.com", "Test@1234")

        assert user.pk is not None

@pytest.mark.django_db
class TestConfirmEmailVerification:
    def test_marks_profile_as_verified(self, db):
        user = UserFactory()
        token = ProfileChangeTokenFactory(user=user, change_type="verify")

        confirm_email_verification(str(token.token))

        user.profile.refresh_from_db()
        assert user.profile.is_verified is True

    def test_deletes_token_after_confirmation(self, db):
        user = UserFactory()
        token = ProfileChangeTokenFactory(user=user, change_type="verify")
        token_str = str(token.token)

        confirm_email_verification(token_str)

        assert not ProfileChangeToken.objects.filter(token=token_str).exists()

    def test_raises_for_invalid_token(self, db):
        with pytest.raises(InvalidToken):
            confirm_email_verification("00000000-0000-0000-0000-000000000000")

    def test_raises_for_invalid_uuid_string(self, db):
        with pytest.raises(InvalidToken):
            confirm_email_verification("not-a-uuid")

@pytest.mark.django_db
class TestRequestEmailChange:
    def test_creates_token_and_sends_email(self, db):
        user = UserFactory(email="old@test.com")

        with patch("users.services._send_email") as mock_email:
            request_email_change(user, "new@test.com")

        assert ProfileChangeToken.objects.filter(user=user, change_type="email").exists()
        mock_email.assert_called_once()

    def test_raises_when_new_email_in_use(self, db):
        UserFactory(email="taken@test.com")
        user = UserFactory(email="original@test.com")

        with pytest.raises(EmailAlreadyInUse):
            request_email_change(user, "taken@test.com")

    def test_replaces_existing_token(self, db):
        user = UserFactory()
        ProfileChangeTokenFactory(user=user, change_type="email", new_value="old@test.com")

        with patch("users.services._send_email"):
            request_email_change(user, "new@test.com")

        tokens = ProfileChangeToken.objects.filter(user=user, change_type="email")
        assert tokens.count() == 1
        assert tokens.first().new_value == "new@test.com"

@pytest.mark.django_db
class TestForgotPassword:
    def test_sends_email_when_user_exists(self, db):
        user = UserFactory(email="found@test.com")

        with patch("users.services._send_email") as mock_email:
            forgot_password("found@test.com")

        mock_email.assert_called_once()

    def test_silent_when_email_not_found(self, db):
        with patch("users.services._send_email") as mock_email:
            forgot_password("notfound@test.com")

        mock_email.assert_not_called()

@pytest.mark.django_db
class TestUpdateUsername:
    def test_updates_username_successfully(self, db):
        user = UserFactory(username="oldname")

        updated = update_username(user, "newname")

        assert updated.username == "newname"
        user.refresh_from_db()
        assert user.username == "newname"

    def test_raises_when_username_taken_by_other(self, db):
        UserFactory(username="taken")
        user = UserFactory(username="mine")

        with pytest.raises(UsernameAlreadyInUse):
            update_username(user, "taken")

    def test_allows_same_username_for_same_user(self, db):
        user = UserFactory(username="same")

        updated = update_username(user, "same")

        assert updated.username == "same"

@pytest.mark.django_db
class TestFavorites:
    def test_add_favorite(self, user, db):
        add_favorite(user, 42)

        from users.models import Favorite
        assert Favorite.objects.filter(user=user, game_id=42).exists()

    def test_add_favorite_is_idempotent(self, user, db):
        add_favorite(user, 42)
        add_favorite(user, 42)

        from users.models import Favorite
        assert Favorite.objects.filter(user=user, game_id=42).count() == 1

    def test_remove_favorite(self, user, db):
        add_favorite(user, 42)
        remove_favorite(user, 42)

        from users.models import Favorite
        assert not Favorite.objects.filter(user=user, game_id=42).exists()

    def test_remove_nonexistent_favorite_is_silent(self, user, db):
        remove_favorite(user, 9999)
