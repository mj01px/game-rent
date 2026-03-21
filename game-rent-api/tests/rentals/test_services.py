import pytest
from django.utils import timezone

from core.exceptions import (
    NoKeysAvailable,
    RefundAlreadyRequested,
    RefundNotResolvable,
    RentalNotFound,
    RentalNotRefundable,
)
from rentals.models import Rental
from rentals.services import (
    create_rental,
    expire_rental,
    request_refund,
    resolve_refund,
)
from tests.conftest import GameKeyFactory, RentalFactory, RefundRequestFactory


@pytest.mark.django_db
class TestCreateRental:
    def test_creates_rental_with_correct_total(self, user, game_with_keys):
        rental = create_rental(user=user, game_id=game_with_keys.pk, rental_days=7)

        expected_total = game_with_keys.rental_price * 7
        assert rental.status == "active"
        assert rental.total_paid == expected_total

    def test_marks_key_as_rented(self, user, game_with_keys):
        rental = create_rental(user=user, game_id=game_with_keys.pk, rental_days=3)

        rental.game_key.refresh_from_db()
        assert rental.game_key.status == "rented"

    def test_sets_expiry_date(self, user, game_with_keys):
        rental = create_rental(user=user, game_id=game_with_keys.pk, rental_days=14)

        # total_seconds inclui horas/segundos — 14 dias = 14 * 86400 segundos
        delta = rental.expires_at - rental.started_at
        assert abs(delta.total_seconds() - 14 * 86400) < 5  # tolerância de 5 segundos

    def test_raises_when_no_keys_available(self, user, game):
        with pytest.raises(NoKeysAvailable):
            create_rental(user=user, game_id=game.pk, rental_days=7)

    def test_raises_when_all_keys_rented(self, user, game):
        GameKeyFactory(game=game, status="rented")

        with pytest.raises(NoKeysAvailable):
            create_rental(user=user, game_id=game.pk, rental_days=7)

    def test_reduces_available_keys(self, user, game_with_keys):
        initial_available = game_with_keys.keys.filter(status="available").count()
        create_rental(user=user, game_id=game_with_keys.pk, rental_days=1)

        assert game_with_keys.keys.filter(status="available").count() == initial_available - 1


@pytest.mark.django_db
class TestRequestRefund:
    def test_creates_pending_refund(self, user, rental):
        refund = request_refund(user=user, rental_id=rental.pk, reason="Não gostei")

        assert refund.status == "pending"
        assert refund.reason == "Não gostei"
        assert refund.user == user

    def test_raises_when_rental_not_found(self, user, db):
        with pytest.raises(RentalNotFound):
            request_refund(user=user, rental_id=99999, reason="")

    def test_raises_when_rental_belongs_to_other_user(self, user, rental, db):
        from tests.conftest import UserFactory
        other = UserFactory()

        with pytest.raises(RentalNotFound):
            request_refund(user=other, rental_id=rental.pk, reason="")

    def test_raises_when_rental_expired(self, user, rental):
        rental.status = "expired"
        rental.save()

        with pytest.raises(RentalNotRefundable):
            request_refund(user=user, rental_id=rental.pk, reason="")

    def test_raises_when_refund_already_requested(self, user, rental):
        request_refund(user=user, rental_id=rental.pk, reason="Primeira vez")

        with pytest.raises(RefundAlreadyRequested):
            request_refund(user=user, rental_id=rental.pk, reason="Segunda vez")


@pytest.mark.django_db
class TestResolveRefund:
    def test_approve_expires_rental_and_releases_key(self, admin, rental):
        refund = RefundRequestFactory(rental=rental, user=rental.user)

        resolve_refund(admin_user=admin, refund_id=refund.pk, action="approve")

        rental.refresh_from_db()
        rental.game_key.refresh_from_db()
        assert rental.status == "expired"
        assert rental.game_key.status == "available"

    def test_approve_sets_resolved_by(self, admin, rental):
        refund = RefundRequestFactory(rental=rental, user=rental.user)

        resolved = resolve_refund(admin_user=admin, refund_id=refund.pk, action="approve")

        assert resolved.resolved_by == admin
        assert resolved.resolved_at is not None

    def test_reject_does_not_release_key(self, admin, rental):
        refund = RefundRequestFactory(rental=rental, user=rental.user)
        original_key_status = rental.game_key.status

        resolve_refund(admin_user=admin, refund_id=refund.pk, action="reject")

        rental.game_key.refresh_from_db()
        assert rental.game_key.status == original_key_status

    def test_raises_when_already_resolved(self, admin, rental):
        refund = RefundRequestFactory(rental=rental, user=rental.user, status="approved")

        with pytest.raises(RefundNotResolvable):
            resolve_refund(admin_user=admin, refund_id=refund.pk, action="reject")


@pytest.mark.django_db
class TestExpireRental:
    def test_expires_rental_and_releases_key(self, rental):
        expire_rental(rental)

        rental.refresh_from_db()
        rental.game_key.refresh_from_db()
        assert rental.status == "expired"
        assert rental.game_key.status == "available"
