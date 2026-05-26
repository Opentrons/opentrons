"""Code for managing log signing keys."""

from pathlib import Path
from typing import Final

from .key_utils import create_or_load

KEY_FILENAME: Final = "audit-signing-key.private"


class SigningKeyManager:
    """A class for managing and ensuring the presence of log signing keys."""

    def __init__(self, key_dir: Path) -> None:
        """Build a signing key manager."""
        self._key = create_or_load(key_dir / KEY_FILENAME)
