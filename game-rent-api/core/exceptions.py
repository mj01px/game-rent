from rest_framework import status
from rest_framework.exceptions import APIException


class GameNotFound(APIException):
    status_code = status.HTTP_404_NOT_FOUND
    default_code = "game_not_found"
    default_detail = "Jogo não encontrado."


class NoKeysAvailable(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_code = "no_keys_available"
    default_detail = "Nenhuma chave disponível para este jogo."


class AlreadyRented(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_code = "already_rented"
    default_detail = "Você já possui um aluguel ativo para este jogo."


class RentalNotFound(APIException):
    status_code = status.HTTP_404_NOT_FOUND
    default_code = "rental_not_found"
    default_detail = "Aluguel não encontrado."


class RefundNotFound(APIException):
    status_code = status.HTTP_404_NOT_FOUND
    default_code = "refund_not_found"
    default_detail = "Solicitação de reembolso não encontrada."


class RefundAlreadyRequested(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_code = "refund_already_requested"
    default_detail = "Já existe uma solicitação de reembolso para este aluguel."


class RefundNotResolvable(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_code = "refund_not_resolvable"
    default_detail = "Esta solicitação de reembolso já foi resolvida."


class RentalNotRefundable(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_code = "rental_not_refundable"
    default_detail = "Apenas aluguéis ativos ou pendentes podem ser reembolsados."


class UserNotFound(APIException):
    status_code = status.HTTP_404_NOT_FOUND
    default_code = "user_not_found"
    default_detail = "Usuário não encontrado."


class InvalidToken(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = "invalid_token"
    default_detail = "Token inválido ou expirado."


class EmailAlreadyInUse(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_code = "email_already_in_use"
    default_detsail = "Este email já está em uso."


class UsernameAlreadyInUse(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_code = "username_already_in_use"
    default_detail = "Este nome de usuário já está em uso."


class EmailNotVerified(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_code = "email_not_verified"
    default_detail = "Email não verificado. Verifique sua caixa de entrada."


class InvalidRentalDuration(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = "invalid_rental_duration"
    default_detail = "A duração do aluguel deve ser entre 1 e 30 dias."