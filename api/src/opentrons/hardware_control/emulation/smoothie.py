import logging
from typing import Optional
from .command_processor import CommandProcessor

logger = logging.getLogger(__name__)


class SmoothieEmulator(CommandProcessor):
    """Smoothie emulator"""

    def __init__(self) -> None:
        pass

    def handle(self, cmd: str, payload: str) -> Optional[str]:
        """Handle a command."""
        logger.info(f"Got command {cmd}")
        return None
