"""Utilities useful across the server."""

import asyncio
from logging import getLogger

LOG = getLogger(__name__)


async def subproc_wait_timeout(
    subproc: asyncio.subprocess.Process,
    timeout: float | None = None,
) -> int:
    """Wait for a subprocess with a timeout, returning -ETIMEDOUT if the timeout hits."""
    try:
        return await asyncio.wait_for(subproc.wait(), timeout=(timeout or 10))
    except asyncio.TimeoutError:
        LOG.error("subprocess call timed out, terminating")
        subproc.terminate()
        return -60
