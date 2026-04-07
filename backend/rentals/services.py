from datetime import timedelta

from django.contrib.auth.models import User
from django.db import transaction
from django.utils import timezone

from core.exceptions import (
    NoKeysAvailable,
    RefundAlreadyRequested,
    RefundNotResolvable,
    RentalNotRefundable,
    InvalidRentalDuration,
)
from games.selectors import get_game_by_id
from .models import RefundRequest, Rental
from .selectors import get_refund_by_id, get_rental_by_id

@transaction.atomic
def create_rental(user: User, game_id: int, rental_days: int) -> Rental:

    if not (1 <= rental_days <= 30):
        raise InvalidRentalDuration()

    game = get_game_by_id(game_id)

    key = (
        game.keys
        .select_for_update(skip_locked=True)
        .filter(status="available")
        .first()
    )
    if key is None:
        raise NoKeysAvailable()

    key.status = "rented"
    key.save(update_fields=["status"])

    rental = Rental.objects.create(
        user=user,
        game_key=key,
        status="active",
        expires_at=timezone.now() + timedelta(days=rental_days),
        total_paid=game.rental_price * rental_days,
    )

    return rental

@transaction.atomic
def request_refund(user: User, rental_id: int, reason: str) -> RefundRequest:
    rental = get_rental_by_id(rental_id, user=user)

    if rental.status not in ("active", "pending"):
        raise RentalNotRefundable()

    if RefundRequest.objects.filter(rental=rental).exists():
        raise RefundAlreadyRequested()

    return RefundRequest.objects.create(
        rental=rental,
        user=user,
        reason=reason,
    )

@transaction.atomic
def resolve_refund(admin_user: User, refund_id: int, action: str) -> RefundRequest:
    refund = get_refund_by_id(refund_id)

    if refund.status != "pending":
        raise RefundNotResolvable()

    refund.resolved_by = admin_user
    refund.resolved_at = timezone.now()

    if action == "approve":
        refund.status = "approved"
        rental = refund.rental
        rental.status = "expired"
        rental.save(update_fields=["status"])
        rental.game_key.status = "available"
        rental.game_key.save(update_fields=["status"])
    else:
        refund.status = "rejected"

    refund.save(update_fields=["status", "resolved_by", "resolved_at"])

    return refund

def expire_rental(rental: Rental) -> None:
    rental.status = "expired"
    rental.save(update_fields=["status"])
    rental.game_key.status = "available"
    rental.game_key.save(update_fields=["status"])
