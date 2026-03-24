import pytest
import factory
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

from games.models import Game, GameKey, Publisher
from rentals.models import RefundRequest, Rental
from users.models import Favorite, ProfileChangeToken, UserProfile


# ---------------------------------------------------------------------------
# Factories
# ---------------------------------------------------------------------------

class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
        skip_postgeneration_save = True

    username = factory.Sequence(lambda n: f"user{n}")
    email = factory.LazyAttribute(lambda o: f"{o.username}@test.com")
    password = factory.PostGenerationMethodCall("set_password", "Test@1234")

    @factory.post_generation
    def profile(obj, create, extracted, **kwargs):
        if not create:
            return
        obj.save()  # persiste o set_password antes de criar o profile
        UserProfile.objects.create(user=obj, is_verified=True)


class AdminFactory(UserFactory):
    class Meta:
        model = User
        skip_postgeneration_save = True

    is_staff = True
    username = factory.Sequence(lambda n: f"admin{n}")


class PublisherFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Publisher

    name = factory.Sequence(lambda n: f"Publisher {n}")


class GameFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Game

    name = factory.Sequence(lambda n: f"Game {n}")
    platform = "pc"
    rental_price = factory.Faker("pydecimal", left_digits=2, right_digits=2, positive=True)
    original_price = factory.Faker("pydecimal", left_digits=2, right_digits=2, positive=True)
    rating = factory.Faker("pydecimal", left_digits=1, right_digits=1, positive=True, max_value=5)
    publisher = factory.SubFactory(PublisherFactory)


class GameKeyFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = GameKey

    game = factory.SubFactory(GameFactory)
    key = factory.Faker("uuid4")
    status = "available"


class RentalFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Rental

    user = factory.SubFactory(UserFactory)
    game_key = factory.SubFactory(GameKeyFactory)
    status = "active"
    started_at = factory.LazyFunction(timezone.now)
    expires_at = factory.LazyFunction(lambda: timezone.now() + timedelta(days=7))
    total_paid = factory.Faker("pydecimal", left_digits=3, right_digits=2, positive=True)


class RefundRequestFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = RefundRequest

    rental = factory.SubFactory(RentalFactory)
    user = factory.LazyAttribute(lambda o: o.rental.user)
    reason = "Não gostei do jogo."
    status = "pending"


class ProfileChangeTokenFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ProfileChangeToken

    user = factory.SubFactory(UserFactory)
    token = factory.Faker("uuid4")
    change_type = "verify"
    new_value = ""


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def user(db):
    return UserFactory()


@pytest.fixture
def admin(db):
    return AdminFactory()


@pytest.fixture
def publisher(db):
    return PublisherFactory()


@pytest.fixture
def game(db, publisher):
    return GameFactory(publisher=publisher, rating=4.0)


@pytest.fixture
def game_with_keys(db, game):
    GameKeyFactory.create_batch(3, game=game)
    return game


@pytest.fixture
def rental(db, user, game_with_keys):
    key = game_with_keys.keys.filter(status="available").first()
    key.status = "rented"
    key.save()
    return RentalFactory(user=user, game_key=key)


@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def auth_client(api_client, user):
    """APIClient autenticado como usuário comum."""
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return api_client


@pytest.fixture
def admin_client(api_client, admin):
    """APIClient autenticado como admin."""
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(admin)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return api_client
