from django.db import models
from django.contrib.auth.models import User
from games.models import GameKey

class Rental(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('expired', 'Expired'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rentals')
    game_key = models.ForeignKey(GameKey, on_delete=models.CASCADE, related_name='rentals')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    started_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    total_paid = models.DecimalField(max_digits=8, decimal_places=2)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.user.username} - {self.game_key.game.name}"

class RefundRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    rental = models.OneToOneField(Rental, on_delete=models.CASCADE, related_name='refund_request')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='refund_requests')
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    requested_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_refunds')

    class Meta:
        ordering = ['-requested_at']

    def __str__(self):
        return f"Refund: {self.user.username} - {self.rental.game_key.game.name} [{self.status}]"