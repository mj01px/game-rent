from django.contrib.auth.models import User
from django.db.models import Count, QuerySet

from core.exceptions import RefundNotFound, RentalNotFound
from .models import RefundRequest, Rental

def get_user_rentals(user: User) -> QuerySet[Rental]:
    """Retorna todos os aluguéis de um usuário com dados do jogo carregados."""
    return (
        Rental.objects
        .select_related("game_key__game", "game_key__game__publisher")
        .prefetch_related("refund_request")
        .filter(user=user)
    )

def get_rental_by_id(rental_id: int, user: User | None = None) -> Rental:
    """Retorna um aluguel pelo ID, opcionalmente restrito a um usuário.

    Args:
        rental_id: PK do aluguel.
        user: se informado, filtra pelo dono do aluguel.

    Raises:
        RentalNotFound: se o aluguel não existir ou não pertencer ao usuário.
    """
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
    """Retorna todos os aluguéis com dados de usuário e jogo (uso admin)."""
    return Rental.objects.select_related(
        "user",
        "user__profile",
        "game_key__game",
    ).all()

def get_refund_requests(status: str | None = None) -> QuerySet[RefundRequest]:
    """Retorna solicitações de reembolso com filtro opcional de status."""
    qs = RefundRequest.objects.select_related(
        "user",
        "rental__game_key__game",
        "resolved_by",
    )
    if status:
        qs = qs.filter(status=status)
    return qs

def get_refund_by_id(refund_id: int) -> RefundRequest:
    """Retorna uma solicitação de reembolso pelo ID.

    Raises:
        RefundNotFound: se a solicitação não existir.
    """
    try:
        return RefundRequest.objects.select_related(
            "rental__game_key",
            "rental__user",
            "user",
        ).get(pk=refund_id)
    except RefundRequest.DoesNotExist:
        raise RefundNotFound()

def get_users_with_rental_stats() -> QuerySet[User]:
    """Retorna todos os usuários com contagem de aluguéis (uso admin).

    Usa annotate para evitar N+1 na contagem de rentals.
    """
    return (
        User.objects
        .select_related("profile")
        .annotate(rental_count=Count("rentals"))
        .order_by("-date_joined")
    )
