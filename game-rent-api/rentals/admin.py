from django.contrib import admin
from .models import Rental


@admin.register(Rental)
class RentalAdmin(admin.ModelAdmin):
    list_display = ['user', 'game_key', 'status', 'started_at', 'expires_at']
    list_filter = ['status']