from django.contrib.auth.models import User
from django.db.models import Count, QuerySet

from core.exceptions import RefundNotFound, RentalNotFound
from .models import RefundRequest, Rental

def get_user_rentals(user: User) -> QuerySet[Rental]:
    return (
        Rental.objects
        .select_related("game_key__game", "game_key__game__publisher")
        .prefetch_related("refund_request")
        .filter(user=user)
    )

def get_rental_by_id(rental_id: int, user: User | None = None) -> Rental:
    try:
        qs = Rental.objects.select_related(
            "game_key__game",
            "game_key__game__publisher",
            "user",
        )
        if user is not None:
            qs = qs.filter(user=user)
        return qs.get(pk=rental_id)
    except Rental.DoesNotExist:
        raise RentalNotFound()

def get_all_rentals() -> QuerySet[Rental]:
    return Rental.objects.select_related(
        "user",
        "user__profile",
        "game_key__game",
    ).all()

def get_refund_requests(status: str | None = None) -> QuerySet[RefundRequest]:
    qs = RefundRequest.objects.select_related(
        "user",
        "rental__game_key__game",
        "resolved_by",
    )
    if status:
        qs = qs.filter(status=status)
    return qs

def get_refund_by_id(refund_id: int) -> RefundRequest:
    try:
        return RefundRequest.objects.select_related(
            "rental__game_key",
            "rental__user",
            "user",
        ).get(pk=refund_id)
    except RefundRequest.DoesNotExist:
        raise RefundNotFound()

def get_users_with_rental_stats() -> QuerySet[User]:
    return (
        User.objects
        .select_related("profile")
        .annotate(rental_count=Count("rentals"))
        .order_by("-date_joined")
    )
