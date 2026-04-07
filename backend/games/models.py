from django.db import models
from django.contrib.auth.models import User

class Publisher(models.Model):
    name = models.CharField(max_length=200, unique=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

class Game(models.Model):
    PLATFORM_CHOICES = [
        ('pc', 'PC'),
        ('playstation', 'PlayStation'),
        ('xbox', 'Xbox'),
        ('switch', 'Nintendo Switch'),
        ('ps5', 'PlayStation 5'),
    ]

    FEATURED_MIN_RATING = 4.7

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='game_images/', null=True, blank=True)
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES, default='pc')
    original_price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    rental_price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=0)
    is_featured = models.BooleanField(default=False)
    is_new = models.BooleanField(default=False)

    publisher = models.ForeignKey(
        Publisher,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='games'
    )

    release_date = models.DateField(null=True, blank=True)
    genre = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-rating']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.is_featured and self.rating < self.FEATURED_MIN_RATING:
            self.is_featured = False
        super().save(*args, **kwargs)

    @property
    def platform_display(self):
        return dict(self.PLATFORM_CHOICES).get(self.platform, self.platform)

class GameKey(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('rented', 'Rented'),
    ]

    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='keys')
    key = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.game.name} - {self.key}'