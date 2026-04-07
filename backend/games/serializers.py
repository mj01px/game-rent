from rest_framework import serializers
from .models import Game, GameKey, Publisher

class PublisherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Publisher
        fields = ['id', 'name']

class GameSerializer(serializers.ModelSerializer):
    available_keys = serializers.SerializerMethodField()
    platform_display = serializers.CharField(source='get_platform_display', read_only=True)
    image = serializers.SerializerMethodField()
    publisher = PublisherSerializer(read_only=True)

    class Meta:
        model = Game
        fields = [
            'id', 'name', 'description', 'image', 'platform',
            'platform_display', 'original_price', 'rental_price',
            'rating', 'is_featured', 'is_new', 'publisher',
            'release_date', 'genre', 'available_keys', 'created_at'
        ]

    def get_available_keys(self, obj):
        return obj.keys.filter(status='available').count()

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None

class GameKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = GameKey
        fields = ['id', 'game', 'key', 'status', 'created_at']