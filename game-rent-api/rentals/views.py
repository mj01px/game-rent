from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from core.exceptions import UserNotFound
from core.permissions import IsAdminUser
from core.responses import api_error, api_response
from .selectors import (
    get_all_rentals,
    get_refund_requests,
    get_rental_by_id,
    get_user_rentals,
    get_users_with_rental_stats,
)
from .serializers import (
    AdminRefundSerializer,
    AdminRentalSerializer,
    AdminUserSerializer,
    CreateRentalSerializer,
    RentalSerializer,
)
from .services import create_rental, request_refund, resolve_refund


# ─── USER ENDPOINTS ───────────────────────────────────────────────────────────

class RentalListView(generics.ListAPIView):
    """Lista os aluguéis do usuário autenticado."""

    serializer_class = RentalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return get_user_rentals(self.request.user)


class CreateRentalView(APIView):
    """Cria um novo aluguel para o usuário autenticado."""

    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = CreateRentalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        rental = create_rental(
            user=request.user,
            game_id=serializer.validated_data["game_id"],
            rental_days=serializer.validated_data["rental_days"],
        )

        return api_response(
            data=RentalSerializer(rental, context={"request": request}).data,
            status_code=status.HTTP_201_CREATED,
        )


class RentalDetailView(generics.RetrieveAPIView):
    """Detalhe de um aluguel do usuário autenticado."""

    serializer_class = RentalSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self) -> Rental:
        return get_rental_by_id(self.kwargs["pk"], user=self.request.user)

    def retrieve(self, request: Request, *args, **kwargs) -> Response:
        rental = self.get_object()
        serializer = self.get_serializer(rental, context={"request": request})
        return api_response(data=serializer.data)


# rentals/views.py

class RequestRefundView(APIView):
    """Solicita reembolso de um aluguel."""

    permission_classes = [IsAuthenticated]

    def post(self, request: Request, pk: int) -> Response:
        reason = request.data.get("reason", "")

        # DEFESA: Limite de tamanho
        if len(reason) > 500:
            return api_error(
                code="REASON_TOO_LONG",
                message="O motivo deve ter no máximo 500 caracteres.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        request_refund(
            user=request.user,
            rental_id=pk,
            reason=reason,
        )
        return api_response(
            data={"detail": "Solicitação de reembolso enviada. Aguardando aprovação."},
            status_code=status.HTTP_201_CREATED,
        )


# ─── ADMIN ENDPOINTS ──────────────────────────────────────────────────────────

class AdminRentalListView(APIView):
    """Lista todos os aluguéis (admin)."""

    permission_classes = [IsAdminUser]

    def get(self, request: Request) -> Response:
        rentals = get_all_rentals()
        serializer = AdminRentalSerializer(rentals, many=True, context={"request": request})
        return api_response(data=serializer.data)


class AdminRefundListView(APIView):
    """Lista todas as solicitações de reembolso (admin)."""

    permission_classes = [IsAdminUser]

    def get(self, request: Request) -> Response:
        refunds = get_refund_requests()
        serializer = AdminRefundSerializer(refunds, many=True, context={"request": request})
        return api_response(data=serializer.data)


class AdminRefundActionView(APIView):
    """Aprova ou rejeita uma solicitação de reembolso (admin)."""

    permission_classes = [IsAdminUser]

    def post(self, request: Request, pk: int) -> Response:
        action = request.data.get("action")
        if action not in ("approve", "reject"):
            return api_error(
                code="INVALID_ACTION",
                message='O campo "action" deve ser "approve" ou "reject".',
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        refund = resolve_refund(admin_user=request.user, refund_id=pk, action=action)
        return api_response(data={"detail": f"Reembolso {refund.status}."})


class AdminUserListView(APIView):
    """Lista todos os usuários com estatísticas de aluguel (admin)."""

    permission_classes = [IsAdminUser]

    def get(self, request: Request) -> Response:
        users = get_users_with_rental_stats()
        serializer = AdminUserSerializer(users, many=True, context={"request": request})
        return api_response(data=serializer.data)


class AdminSendPasswordResetView(APIView):
    """Envia email de redefinição de senha para um usuário (admin)."""

    permission_classes = [IsAdminUser]

    def post(self, request: Request, user_id: int) -> Response:
        from django.contrib.auth.models import User
        from users.services import send_password_reset_email

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            raise UserNotFound()

        send_password_reset_email(user)
        return api_response(
            data={"detail": f"Email de redefinição enviado para {user.email}."}
        )
