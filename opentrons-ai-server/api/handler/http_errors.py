import structlog
from fastapi import HTTPException, status

from api.models.internal_server_error import InternalServerError
from api.settings import get_settings

logger = structlog.stdlib.get_logger(get_settings().logger_name)


def internal_server_http_exception(log_message: str) -> HTTPException:
    """Build a generic 500 response. Call only from an ``except`` block so ``logger.exception`` records the traceback."""
    logger.exception(log_message)
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=InternalServerError().model_dump(by_alias=True),
    )
