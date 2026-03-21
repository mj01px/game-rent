from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import View


class IsAdminUser(BasePermission):
    """Permite acesso apenas a usuários staff/admin."""

    def has_permission(self, request: Request, view: View) -> bool:
        return bool(request.user and request.user.is_staff)


class IsOwnerOrAdmin(BasePermission):
    """Permite acesso ao dono do objeto ou a admins.

    O model do objeto deve ter um campo `user` apontando para o usuário.
    """

    def has_object_permission(self, request: Request, view: View, obj: object) -> bool:
        if request.user and request.user.is_staff:
            return True
        return getattr(obj, "user", None) == request.user
