from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from core.validators import validate_password_strength

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)

    def validate_password(self, value: str) -> str:
        try:
            validate_password_strength(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value

class UpdateUsernameSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)

    def validate_username(self, value: str) -> str:
        if value == self.context["request"].user.username:
            raise serializers.ValidationError("Este já é o seu nome de usuário.")
        return value

class RequestEmailChangeSerializer(serializers.Serializer):
    new_email = serializers.EmailField()

class ConfirmChangeSerializer(serializers.Serializer):

    token = serializers.CharField()
    type = serializers.ChoiceField(choices=["verify", "email", "email_new", "password"])
    confirmed = serializers.BooleanField(required=False, default=False)
    new_password = serializers.CharField(required=False, write_only=True)

    def validate_new_password(self, value: str) -> str:
        try:
            validate_password_strength(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

class FavoriteSerializer(serializers.Serializer):
    game_id = serializers.IntegerField()
