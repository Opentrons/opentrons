"""Tests for the signing key manager."""

from pathlib import Path

from key_server.log_signing.key_utils import create_or_load
from key_server.log_signing.manager import KEY_FILENAME, SigningKeyManager


def test_creates_key_on_load(tmp_path: Path) -> None:
    """It should create or load a key when the object is created."""
    manager = SigningKeyManager(tmp_path)
    assert (tmp_path / KEY_FILENAME).exists()
    loaded = create_or_load(tmp_path / KEY_FILENAME)
    assert manager._key.private_bytes_raw() == loaded.private_bytes_raw()
