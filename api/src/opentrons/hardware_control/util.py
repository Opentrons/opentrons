import asyncio
import logging
from typing import Dict, Any, Optional

mod_log = logging.getLogger(__name__)


def _handle_loop_exception(loop: asyncio.AbstractEventLoop,
                           context: Dict[str, Any]):
    mod_log.error(f"Caught exception: {context['exception']}:"
                  f" {context['message']}")


def use_or_initialize_loop(loop: Optional[asyncio.AbstractEventLoop]
                           ) -> asyncio.AbstractEventLoop:
    checked_loop = loop or asyncio.get_event_loop()
    checked_loop.set_exception_handler(_handle_loop_exception)
    return checked_loop
