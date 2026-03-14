from django.urls import path
from . import views

urlpatterns = [
    path('', views.GameListView.as_view(), name='game-list'),
    path('<int:pk>/', views.GameDetailView.as_view(), name='game-detail'),

    # Admin CRUD
    path('admin/create/', views.AdminGameCreateView.as_view(), name='admin-game-create'),
    path('admin/<int:pk>/', views.AdminGameDetailView.as_view(), name='admin-game-detail'),
]