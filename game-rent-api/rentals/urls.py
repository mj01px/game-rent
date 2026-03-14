from django.urls import path
from . import views

urlpatterns = [
    # User endpoints
    path('', views.RentalListView.as_view(), name='rental-list'),
    path('create/', views.CreateRentalView.as_view(), name='rental-create'),
    path('<int:pk>/', views.RentalDetailView.as_view(), name='rental-detail'),
    path('<int:pk>/refund/', views.RequestRefundView.as_view(), name='rental-refund'),

    # Admin endpoints
    path('admin/all/', views.AdminRentalListView.as_view(), name='admin-rental-list'),
    path('admin/refunds/', views.AdminRefundListView.as_view(), name='admin-refund-list'),
    path('admin/refunds/<int:pk>/action/', views.AdminRefundActionView.as_view(), name='admin-refund-action'),
    path('admin/users/', views.AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/users/<int:user_id>/send-reset/', views.AdminSendPasswordResetView.as_view(), name='admin-send-reset'),
]