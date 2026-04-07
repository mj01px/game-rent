from rest_framework import filters, generics, status
from rest_framework.permissions import AllowAny
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsAdminUser
from core.responses import api_error, api_response
from .models import Publisher
from .selectors import get_game_by_id, get_game_list
from .serializers import GameSerializer, PublisherSerializer
from .services import (
    create_game, create_publisher, delete_game, delete_publisher,
    update_game, update_publisher,
)

class GameListView(generics.ListAPIView):

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

    serializer_class = GameSerializer
    permission_classes = [AllowAny]

    def get_object(self) -> object:
        return get_game_by_id(self.kwargs["pk"])

    def retrieve(self, request: Request, *args, **kwargs) -> Response:
        game = self.get_object()
        serializer = self.get_serializer(game)
        return api_response(data=serializer.data)

class AdminGameCreateView(APIView):

    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request: Request) -> Response:
        game = create_game(data=request.data, image=request.FILES.get("image"))
        serializer = GameSerializer(game, context={"request": request})
        return api_response(data=serializer.data, status_code=status.HTTP_201_CREATED)

class AdminGameDetailView(APIView):

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

class PublisherListView(generics.ListAPIView):

    serializer_class = PublisherSerializer
    permission_classes = [AllowAny]
    queryset = Publisher.objects.all().order_by("name")

    def list(self, request: Request, *args, **kwargs) -> Response:
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return api_response(data=serializer.data)

class AdminPublisherCreateView(APIView):

    permission_classes = [IsAdminUser]

    def post(self, request: Request) -> Response:
        name = request.data.get("name", "").strip()
        if not name:
            return api_error("VALIDATION_ERROR", "O campo name é obrigatório.", status_code=status.HTTP_400_BAD_REQUEST)
        try:
            publisher = create_publisher(name)
        except ValueError as e:
            return api_error("CONFLICT", str(e), status_code=status.HTTP_409_CONFLICT)
        return api_response(data=PublisherSerializer(publisher).data, status_code=status.HTTP_201_CREATED)

class AdminPublisherDetailView(APIView):

    permission_classes = [IsAdminUser]

    def patch(self, request: Request, pk: int) -> Response:
        try:
            publisher = Publisher.objects.get(pk=pk)
        except Publisher.DoesNotExist:
            return api_error("NOT_FOUND", "Publisher não encontrado.", status_code=status.HTTP_404_NOT_FOUND)
        name = request.data.get("name", "").strip()
        if not name:
            return api_error("VALIDATION_ERROR", "O campo name é obrigatório.", status_code=status.HTTP_400_BAD_REQUEST)
        try:
            publisher = update_publisher(publisher, name)
        except ValueError as e:
            return api_error("CONFLICT", str(e), status_code=status.HTTP_409_CONFLICT)
        return api_response(data=PublisherSerializer(publisher).data)

    def delete(self, request: Request, pk: int) -> Response:
        try:
            publisher = Publisher.objects.get(pk=pk)
        except Publisher.DoesNotExist:
            return api_error("NOT_FOUND", "Publisher não encontrado.", status_code=status.HTTP_404_NOT_FOUND)
        delete_publisher(publisher)
        return Response(status=status.HTTP_204_NO_CONTENT)
