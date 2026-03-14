from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from .models import Rental, RefundRequest
from .serializers import RentalSerializer, CreateRentalSerializer

PLATFORM_MAP = {
    'pc': 'PC', 'ps5': 'PlayStation 5', 'ps4': 'PlayStation 4',
    'xbox_series': 'Xbox Series X/S', 'xbox_one': 'Xbox One',
    'nintendo_switch': 'Nintendo Switch', 'mobile': 'Mobile',
}

# ─── USER ENDPOINTS ──────────────────────────────────────────────

class RentalListView(generics.ListAPIView):
    serializer_class = RentalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Rental.objects.filter(user=self.request.user)


class CreateRentalView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateRentalSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            rental = serializer.save()
            return Response(RentalSerializer(rental).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RentalDetailView(generics.RetrieveAPIView):
    serializer_class = RentalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Rental.objects.filter(user=self.request.user)


class RequestRefundView(APIView):
    """Usuário solicita reembolso de um aluguel."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            rental = Rental.objects.get(pk=pk, user=request.user)
        except Rental.DoesNotExist:
            return Response({'error': 'Rental not found.'}, status=status.HTTP_404_NOT_FOUND)

        if rental.status not in ('active', 'pending'):
            return Response({'error': 'Only active or pending rentals can be refunded.'}, status=status.HTTP_400_BAD_REQUEST)

        if hasattr(rental, 'refund_request'):
            return Response({'error': 'Refund already requested.'}, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get('reason', '')
        RefundRequest.objects.create(rental=rental, user=request.user, reason=reason)
        return Response({'detail': 'Refund request submitted. Awaiting admin approval.'}, status=status.HTTP_201_CREATED)


# ─── ADMIN ENDPOINTS ─────────────────────────────────────────────

class AdminRentalListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        rentals = Rental.objects.select_related('user', 'game_key__game').all()
        data = []
        for r in rentals:
            game = r.game_key.game
            avatar_url = None
            try:
                profile = r.user.profile
                if profile and profile.avatar:
                    avatar_url = request.build_absolute_uri(profile.avatar.url)
            except Exception:
                pass

            image_url = None
            try:
                if game.image:
                    image_url = request.build_absolute_uri(game.image.url)
            except Exception:
                pass

            data.append({
                'id': r.id,
                'username': r.user.username,
                'user_email': r.user.email,
                'user_avatar': avatar_url,
                'game_name': game.name,
                'game_image': image_url,
                'platform': PLATFORM_MAP.get(game.platform, game.platform),
                'status': r.status,
                'started_at': r.started_at,
                'expires_at': r.expires_at,
                'total_paid': str(r.total_paid),
                'has_refund_request': hasattr(r, 'refund_request'),
            })
        return Response(data)


class AdminRefundListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        refunds = RefundRequest.objects.select_related(
            'user', 'rental__game_key__game', 'resolved_by'
        ).all()
        data = []
        for rf in refunds:
            game = rf.rental.game_key.game
            image_url = None
            try:
                if game.image:
                    image_url = request.build_absolute_uri(game.image.url)
            except Exception:
                pass

            data.append({
                'id': rf.id,
                'rental_id': rf.rental.id,
                'username': rf.user.username,
                'user_email': rf.user.email,
                'game_name': game.name,
                'game_image': image_url,
                'total_paid': str(rf.rental.total_paid),
                'reason': rf.reason,
                'status': rf.status,
                'requested_at': rf.requested_at,
                'resolved_at': rf.resolved_at,
                'resolved_by': rf.resolved_by.username if rf.resolved_by else None,
            })
        return Response(data)


class AdminRefundActionView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            refund = RefundRequest.objects.select_related('rental__game_key').get(pk=pk)
        except RefundRequest.DoesNotExist:
            return Response({'error': 'Refund request not found.'}, status=status.HTTP_404_NOT_FOUND)

        if refund.status != 'pending':
            return Response({'error': 'This request has already been resolved.'}, status=status.HTTP_400_BAD_REQUEST)

        action = request.data.get('action')
        if action not in ('approve', 'reject'):
            return Response({'error': 'action must be "approve" or "reject".'}, status=status.HTTP_400_BAD_REQUEST)

        refund.resolved_by = request.user
        refund.resolved_at = timezone.now()

        if action == 'approve':
            refund.status = 'approved'
            rental = refund.rental
            rental.status = 'expired'
            rental.save()
            game_key = rental.game_key
            game_key.status = 'available'
            game_key.save()
        else:
            refund.status = 'rejected'

        refund.save()
        return Response({'detail': f'Refund {refund.status}.'})


class AdminUserListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        from django.contrib.auth.models import User
        users = User.objects.select_related('profile').all().order_by('-date_joined')
        data = []
        for u in users:
            profile = getattr(u, 'profile', None)
            avatar_url = None
            try:
                if profile and profile.avatar:
                    avatar_url = request.build_absolute_uri(profile.avatar.url)
            except Exception:
                pass
            data.append({
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'is_staff': u.is_staff,
                'is_active': u.is_active,
                'date_joined': u.date_joined,
                'is_verified': profile.is_verified if profile else False,
                'avatar': avatar_url,
                'rental_count': u.rentals.count(),
            })
        return Response(data)


class AdminSendPasswordResetView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, user_id):
        from django.contrib.auth.models import User
        from users.models import ProfileChangeToken
        from django.core.mail import send_mail
        from django.conf import settings
        import uuid

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        token = str(uuid.uuid4())
        ProfileChangeToken.objects.filter(user=user, change_type='password').delete()
        ProfileChangeToken.objects.create(user=user, token=token, change_type='password', new_value='')

        confirm_url = f"{settings.FRONTEND_URL}/confirm-change?token={token}&type=password"
        send_mail(
            subject='Reset your password — GameRent',
            message=(
                f"Hi {user.username},\n\n"
                f"An administrator has sent you a password reset link.\n\n"
                f"Click the link below to set a new password:\n{confirm_url}\n\n"
                f"— GameRent Team"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
        )
        return Response({'detail': f'Password reset email sent to {user.email}.'})