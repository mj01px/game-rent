from django.contrib import admin
from .models import Game, GameKey

@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ['name', 'platform', 'rental_price', 'rating', 'is_featured']
    list_filter = ['platform', 'is_featured']
    search_fields = ['name']

@admin.register(GameKey)
class GameKeyAdmin(admin.ModelAdmin):
    list_display = ['game', 'key', 'status']
    list_filter = ['status']