import re

from django.core.exceptions import ValidationError

def validate_password_strength(password: str) -> None:
    """Valida a força da senha.

    Requisitos: mínimo 6 caracteres, uma maiúscula, uma minúscula,
    um número e um caractere especial.

    Raises:
        ValidationError: se a senha não atender a algum requisito.
    """
    errors: list[str] = []

    if len(password) < 6:
        errors.append("A senha deve ter pelo menos 6 caracteres.")
    if not re.search(r"[A-Z]", password):
        errors.append("A senha deve conter pelo menos uma letra maiúscula.")
    if not re.search(r"[a-z]", password):
        errors.append("A senha deve conter pelo menos uma letra minúscula.")
    if not re.search(r"\d", password):
        errors.append("A senha deve conter pelo menos um número.")
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append("A senha deve conter pelo menos um caractere especial.")

    if errors:
        raise ValidationError(errors)
