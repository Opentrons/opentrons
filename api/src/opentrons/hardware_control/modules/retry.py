"""Retry/backoff helper for module initialization."""

import asyncio
import logging
from typing import Awaitable, Callable, Optional, Tuple, Type, TypeVar

from opentrons.drivers.asyncio.communication.errors import NoResponse
from opentrons.drivers.utils import ParseError

log = logging.getLogger(__name__)

MODULE_BUILD_RETRIES = 5
MODULE_BUILD_INITIAL_BACKOFF_S = 0.1
MODULE_BUILD_MAX_BACKOFF_S = 1.0

# Exceptions that indicate the module is not ready yet and a retry is worthwhile.
MODULE_BUILD_RETRYABLE_ERRORS: Tuple[Type[BaseException], ...] = (
    ParseError,
    NoResponse,
)

_T = TypeVar("_T")


async def retry_module_init(
    factory: Callable[[], Awaitable[_T]],
    port: str = "",
) -> _T:
    """Run `factory` with retry/backoff on retryable module-init errors.

    Args:
        factory: A coroutine factory performing the operation that may fail with
            a retryable error.
        port: Port string used only for logging context.

    Returns: The result of a successful `factory` call.

    Raises: The last retryable error if all attempts fail, or any non-retryable
        error raised by `factory`.
    """
    backoff = MODULE_BUILD_INITIAL_BACKOFF_S
    last_exc: Optional[BaseException] = None

    for attempt in range(0, MODULE_BUILD_RETRIES):
        try:
            return await factory()
        except MODULE_BUILD_RETRYABLE_ERRORS as e:
            last_exc = e
            log.warning(
                f"Module build attempt {attempt}/{MODULE_BUILD_RETRIES} on port "
                f"{port!r} failed with {type(e).__name__}: {e}"
            )
            if attempt < MODULE_BUILD_RETRIES:
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, MODULE_BUILD_MAX_BACKOFF_S)

    assert last_exc is not None
    raise last_exc
