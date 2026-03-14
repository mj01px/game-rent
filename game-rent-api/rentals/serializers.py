from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from .models import Rental
from games.models import Game, GameKey
from games.serializers import GameSerializer


class RentalSerializer(serializers.ModelSerializer):
    game_name = serializers.CharField(source='game_key.game.name', read_only=True)
    game_image = serializers.ImageField(source='game_key.game.image', read_only=True)
    game_key_value = serializers.SerializerMethodField()
    refund_status = serializers.SerializerMethodField()

    class Meta:
        model = Rental
        fields = [
            'id',
            'game_name',
            'game_image',
            'game_key_value',
            'status',
            'started_at',
            'expires_at',
            'total_paid',
            'refund_status',
        ]

    def get_game_key_value(self, obj):
        if obj.status == 'active':
            return obj.game_key.key
        return None

    def get_refund_status(self, obj):
        try:
            return obj.refund_request.status  # 'pending', 'approved', 'rejected'
        except Exception:
            return None  # sem pedido de refund


class CreateRentalSerializer(serializers.Serializer):
    game_id = serializers.IntegerField()
    rental_days = serializers.IntegerField(min_value=1, max_value=30)

    def validate_game_id(self, value):
        try:
            game = Game.objects.get(id=value)
        except Game.DoesNotExist:
            raise serializers.ValidationError("Game not found.")

        if not game.keys.filter(status='available').exists():
            raise serializers.ValidationError("No keys available for this game.")

        return value

    def create(self, validated_data):
        user = self.context['request'].user
        game = Game.objects.get(id=validated_data['game_id'])
        days = validated_data['rental_days']

        game_key = game.keys.filter(status='available').first()
        game_key.status = 'rented'
        game_key.save()

        total = game.rental_price * days

        rental = Rental.objects.create(
            user=user,
            game_key=game_key,
            status='active',
            expires_at=timezone.now() + timedelta(days=days),
            total_paid=total,
        )

        return rental