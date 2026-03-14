from rest_framework import generics, filters, status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Game, Publisher, GameKey
from .serializers import GameSerializer
import json


class GameListView(generics.ListAPIView):
    serializer_class = GameSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['rating', 'rental_price', 'name']

    def get_queryset(self):
        queryset = Game.objects.all()

        platform = self.request.query_params.get('platform')
        if platform:
            queryset = queryset.filter(platform=platform)

        featured = self.request.query_params.get('featured')
        if featured == 'true':
            queryset = queryset.filter(is_featured=True)

        publisher_id = self.request.query_params.get('publisher')
        if publisher_id:
            queryset = queryset.filter(publisher__id=publisher_id)

        return queryset


class GameDetailView(generics.RetrieveAPIView):
    serializer_class = GameSerializer
    permission_classes = [AllowAny]
    queryset = Game.objects.all()


class AdminGameCreateView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        data = request.data

        # Publisher
        publisher = None
        publisher_name = data.get('publisher_name', '').strip()
        if publisher_name:
            publisher, _ = Publisher.objects.get_or_create(name=publisher_name)

        # Genre (vem como JSON string)
        genre_raw = data.get('genre', '[]')
        try:
            genre = json.loads(genre_raw)
        except Exception:
            genre = []

        game = Game(
            name=data.get('name', ''),
            description=data.get('description', ''),
            platform=data.get('platform', 'pc'),
            original_price=data.get('original_price', 0),
            rental_price=data.get('rental_price', 0),
            rating=data.get('rating', 0),
            release_date=data.get('release_date') or None,
            genre=genre,
            is_featured=data.get('is_featured', 'false').lower() == 'true',
            is_new=data.get('is_new', 'false').lower() == 'true',
            publisher=publisher,
        )

        if 'image' in request.FILES:
            game.image = request.FILES['image']

        game.save()

        # Criar keys
        keys_to_add = int(data.get('keys_to_add', 0))
        for _ in range(keys_to_add):
            import uuid
            GameKey.objects.create(game=game, key=str(uuid.uuid4()), status='available')

        serializer = GameSerializer(game, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminGameDetailView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def patch(self, request, pk):
        try:
            game = Game.objects.get(pk=pk)
        except Game.DoesNotExist:
            return Response({'error': 'Game not found.'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data

        # Publisher
        publisher_name = data.get('publisher_name', '').strip()
        if publisher_name:
            publisher, _ = Publisher.objects.get_or_create(name=publisher_name)
            game.publisher = publisher

        # Genre
        genre_raw = data.get('genre')
        if genre_raw is not None:
            try:
                game.genre = json.loads(genre_raw)
            except Exception:
                pass

        if data.get('name'):
            game.name = data.get('name')
        if data.get('description') is not None:
            game.description = data.get('description')
        if data.get('platform'):
            game.platform = data.get('platform')
        if data.get('original_price'):
            game.original_price = float(data.get('original_price'))
        if data.get('rental_price'):
            game.rental_price = float(data.get('rental_price'))
        if data.get('rating'):
            game.rating = float(data.get('rating'))
        if data.get('release_date'):
            game.release_date = data.get('release_date')

        game.is_featured = data.get('is_featured', str(game.is_featured)).lower() == 'true'
        game.is_new = data.get('is_new', str(game.is_new)).lower() == 'true'

        if 'image' in request.FILES:
            game.image = request.FILES['image']

        game.save()

        # Adicionar keys extras
        keys_to_add = int(data.get('keys_to_add', 0))
        if keys_to_add > 0:
            import uuid
            for _ in range(keys_to_add):
                GameKey.objects.create(game=game, key=str(uuid.uuid4()), status='available')

        serializer = GameSerializer(game, context={'request': request})
        return Response(serializer.data)

    def delete(self, request, pk):
        try:
            game = Game.objects.get(pk=pk)
        except Game.DoesNotExist:
            return Response({'error': 'Game not found.'}, status=status.HTTP_404_NOT_FOUND)
        game.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)