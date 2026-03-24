from django.urls import path
from . import views

urlpatterns = [
    path('', views.GameListView.as_view(), name='game-list'),
    path('<int:pk>/', views.GameDetailView.as_view(), name='game-detail'),

    # Admin CRUD — games
    path('admin/create/', views.AdminGameCreateView.as_view(), name='admin-game-create'),
    path('admin/<int:pk>/', views.AdminGameDetailView.as_view(), name='admin-game-detail'),

    # Publishers
    path('publishers/', views.PublisherListView.as_view(), name='publisher-list'),
    path('publishers/admin/create/', views.AdminPublisherCreateView.as_view(), name='admin-publisher-create'),
    path('publishers/admin/<int:pk>/', views.AdminPublisherDetailView.as_view(), name='admin-publisher-detail'),
]