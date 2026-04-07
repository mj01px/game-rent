from rest_framework import serializers

from .models import RefundRequest, Rental

class RentalSerializer(serializers.ModelSerializer):
    game_name = serializers.CharField(source="game_key.game.name", read_only=True)
    game_image = serializers.SerializerMethodField()
    game_key_value = serializers.SerializerMethodField()
    refund_status = serializers.SerializerMethodField()

    class Meta:
        model = Rental
        fields = [
            "id",
            "game_name",
            "game_image",
            "game_key_value",
            "status",
            "started_at",
            "expires_at",
            "total_paid",
            "refund_status",
        ]

    def get_game_image(self, obj: Rental) -> str | None:
        request = self.context.get("request")
        image = obj.game_key.game.image
        if image and request:
            return request.build_absolute_uri(image.url)
        return None

    def get_game_key_value(self, obj: Rental) -> str | None:
        """Expõe a chave apenas enquanto o aluguel está ativo."""
        if obj.status == "active":
            return obj.game_key.key
        return None

    def get_refund_status(self, obj: Rental) -> str | None:
        try:
            return obj.refund_request.status
        except RefundRequest.DoesNotExist:
            return None

class CreateRentalSerializer(serializers.Serializer):
    """Valida o input de criação de aluguel.

    Apenas validação de input — a lógica de negócio fica em services.create_rental().
    """

    game_id = serializers.IntegerField()
    rental_days = serializers.IntegerField(min_value=1, max_value=30)

    def validate_game_id(self, value: int) -> int:
        from games.models import Game

        if not Game.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Jogo não encontrado.")
        return value

class AdminRentalSerializer(serializers.ModelSerializer):
    """Serializer de aluguel para endpoints admin com dados completos."""

    username = serializers.CharField(source="user.username", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)
    user_avatar = serializers.SerializerMethodField()
    game_name = serializers.CharField(source="game_key.game.name", read_only=True)
    game_image = serializers.SerializerMethodField()
    platform = serializers.CharField(source="game_key.game.get_platform_display", read_only=True)
    has_refund_request = serializers.SerializerMethodField()

    class Meta:
        model = Rental
        fields = [
            "id",
            "username",
            "user_email",
            "user_avatar",
            "game_name",
            "game_image",
            "platform",
            "status",
            "started_at",
            "expires_at",
            "total_paid",
            "has_refund_request",
        ]

    def get_user_avatar(self, obj: Rental) -> str | None:
        request = self.context.get("request")
        try:
            avatar = obj.user.profile.avatar
            if avatar and request:
                return request.build_absolute_uri(avatar.url)
        except Exception:
            pass
        return None

    def get_game_image(self, obj: Rental) -> str | None:
        request = self.context.get("request")
        image = obj.game_key.game.image
        if image and request:
            return request.build_absolute_uri(image.url)
        return None

    def get_has_refund_request(self, obj: Rental) -> bool:
        return hasattr(obj, "refund_request")

class AdminRefundSerializer(serializers.ModelSerializer):
    """Serializer de reembolso para endpoints admin."""

    username = serializers.CharField(source="user.username", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)
    rental_id = serializers.IntegerField(source="rental.id", read_only=True)
    game_name = serializers.CharField(source="rental.game_key.game.name", read_only=True)
    game_image = serializers.SerializerMethodField()
    total_paid = serializers.DecimalField(
        source="rental.total_paid", max_digits=8, decimal_places=2, read_only=True
    )
    resolved_by = serializers.CharField(
        source="resolved_by.username", allow_null=True, read_only=True
    )

    class Meta:
        model = RefundRequest
        fields = [
            "id",
            "rental_id",
            "username",
            "user_email",
            "game_name",
            "game_image",
            "total_paid",
            "reason",
            "status",
            "requested_at",
            "resolved_at",
            "resolved_by",
        ]

    def get_game_image(self, obj: RefundRequest) -> str | None:
        request = self.context.get("request")
        image = obj.rental.game_key.game.image
        if image and request:
            return request.build_absolute_uri(image.url)
        return None

class AdminUserSerializer(serializers.Serializer):
    """Serializer de usuário para endpoint admin com stats de aluguel."""

    id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.EmailField()
    is_staff = serializers.BooleanField()
    is_active = serializers.BooleanField()
    date_joined = serializers.DateTimeField()
    is_verified = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    rental_count = serializers.IntegerField()

    def get_is_verified(self, obj) -> bool:
        profile = getattr(obj, "profile", None)
        return profile.is_verified if profile else False

    def get_avatar(self, obj) -> str | None:
        request = self.context.get("request")
        try:
            avatar = obj.profile.avatar
            if avatar and request:
                return request.build_absolute_uri(avatar.url)
        except Exception:
            pass
        return None
