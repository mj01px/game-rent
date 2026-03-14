from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.CustomLoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('profile/check-username/', views.CheckUsernameView.as_view(), name='check-username'),
    path('profile/update-username/', views.UpdateUsernameView.as_view(), name='update-username'),
    path('profile/avatar/', views.AvatarUploadView.as_view(), name='avatar-upload'),
    path('profile/request-email-change/', views.RequestEmailChangeView.as_view(), name='request-email-change'),
    path('profile/request-password-change/', views.RequestPasswordChangeView.as_view(), name='request-password-change'),
    path('profile/confirm-change/', views.ConfirmChangeView.as_view(), name='confirm-change'),
    path('profile/resend-verification/', views.ResendVerificationView.as_view(), name='resend-verification'),
    path('forgot-password/', views.ForgotPasswordView.as_view(), name='forgot-password'),
    path('favorites/', views.FavoritesView.as_view(), name='favorites'),
]