from rest_framework import filters, generics, status
from rest_framework.permissions import AllowAny
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsAdminUser
from core.responses import api_response
from .selectors import get_game_by_id, get_game_list
from .serializers import GameSerializer
from .services import create_game, delete_game, update_game


class GameListView(generics.ListAPIView):
    """Lista pública de jogos com filtros, busca e ordenação.

    Query params:
        platform: filtra por plataforma (pc, playstation, xbox, switch, ps5)
        featured: filtra destaques quando "true"
        publisher: filtra por publisher ID
        search: busca em name e description
        ordering: ordena por rating, rental_price ou name
    """

    serializer_class = GameSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description"]
    ordering_fields = ["rating", "rental_price", "name"]

    def get_queryset(self):
        return get_game_list(
            platform=self.request.query_params.get("platform"),
            featured=self.request.query_params.get("featured"),
            publisher_id=self.request.query_params.get("publisher"),
        )


class GameDetailView(generics.RetrieveAPIView):
    """Detalhe público de um jogo."""

    serializer_class = GameSerializer
    permission_classes = [AllowAny]

    def get_object(self) -> object:
        return get_game_by_id(self.kwargs["pk"])

    def retrieve(self, request: Request, *args, **kwargs) -> Response:
        game = self.get_object()
        serializer = self.get_serializer(game)
        return api_response(data=serializer.data)


class AdminGameCreateView(APIView):
    """Cria um jogo (admin)."""

    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request: Request) -> Response:
        game = create_game(data=request.data, image=request.FILES.get("image"))
        serializer = GameSerializer(game, context={"request": request})
        return api_response(data=serializer.data, status_code=status.HTTP_201_CREATED)


class AdminGameDetailView(APIView):
    """Atualiza ou remove um jogo (admin)."""

    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def patch(self, request: Request, pk: int) -> Response:
        game = get_game_by_id(pk)
        updated = update_game(game=game, data=request.data, image=request.FILES.get("image"))
        serializer = GameSerializer(updated, context={"request": request})
        return api_response(data=serializer.data)

    def delete(self, request: Request, pk: int) -> Response:
        game = get_game_by_id(pk)
        delete_game(game)
        return Response(status=status.HTTP_204_NO_CONTENT)
