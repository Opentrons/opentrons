"""Tests for the signing key manager."""

import base64
from pathlib import Path

import pytest
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ed25519

from key_server.log_signing.key_utils import create_or_load
from key_server.log_signing.manager import KEY_FILENAME, SigningKeyManager
from key_server.log_signing.types import LogSigningRequestError


def test_creates_key_on_load(tmp_path: Path) -> None:
    """It should create or load a key when the object is created."""
    manager = SigningKeyManager(tmp_path)
    assert (tmp_path / KEY_FILENAME).exists()
    loaded = create_or_load(tmp_path / KEY_FILENAME)
    assert manager._key.private_bytes_raw() == loaded.private_bytes_raw()


def test_signs_with_own_key(tmp_path: Path) -> None:
    """It should sign a hash pair using the private side of the same key it returns."""
    hash_1 = b"asdasdasd"
    hash_2 = b"lkjlkjlkj"
    manager = SigningKeyManager(tmp_path)
    hash_1_encoded = f"sha256:{base64.urlsafe_b64encode(hash_1).decode('utf-8')}"
    hash_2_encoded = f"sha256:{base64.urlsafe_b64encode(hash_2).decode('utf-8')}"
    signature_encoded = manager.sign_hashpair(hash_1_encoded, hash_2_encoded)
    signature = base64.urlsafe_b64decode(signature_encoded.split(":")[1])
    public_pem = manager.get_public_key_pem()
    public_key = serialization.load_pem_public_key(public_pem.encode("utf-8"))
    assert isinstance(public_key, ed25519.Ed25519PublicKey)
    public_key.verify(signature, hash_1 + hash_2)


def test_signs_empty_hashpair(tmp_path: Path) -> None:
    """It should sign a hashpair with the previous hash not set."""
    hash_1 = b"asdasdasd"
    hash_2 = b""
    manager = SigningKeyManager(tmp_path)
    hash_1_encoded = f"sha256:{base64.urlsafe_b64encode(hash_1).decode('utf-8')}"
    signature_encoded = manager.sign_hashpair(hash_1_encoded, None)
    signature = base64.urlsafe_b64decode(signature_encoded.split(":")[1])
    public_pem = manager.get_public_key_pem()
    public_key = serialization.load_pem_public_key(public_pem.encode("utf-8"))
    assert isinstance(public_key, ed25519.Ed25519PublicKey)
    public_key.verify(signature, hash_1 + hash_2)


async def test_hashes_message(tmp_path: Path) -> None:
    """It should hash a message from its utf-8 value."""
    message_contents = "bobobobobobobobobobobobo" * 100
    manager = SigningKeyManager(tmp_path)
    hash_val = await manager.hash_message(message_contents)
    hasher = hashes.Hash(hashes.SHA256())
    hasher.update(message_contents.encode("utf-8"))
    message_hash = (
        f"sha256:{base64.urlsafe_b64encode(hasher.finalize()).decode('utf-8')}"
    )
    assert message_hash == hash_val


async def test_fails_hash_of_bad_message(tmp_path: Path) -> None:
    """It should fail to hash a non-utf8 message with a controlled error."""
    manager = SigningKeyManager(tmp_path)
    with pytest.raises(LogSigningRequestError):
        await manager.hash_message("\ud800")


@pytest.mark.parametrize(
    "bad_hash",
    [("", "YXNkYXNk", "sha512:YXNkYXNk", ":YXNkYXNk", "sha256:", ":", "sha256:///.")],
)
def fails_sign_of_bad_message_hash(tmp_path: Path, bad_hash: str) -> None:
    """It should fail to sign a message hash that is not properly encoded."""
    manager = SigningKeyManager(tmp_path)
    with pytest.raises(LogSigningRequestError):
        manager.sign_hashpair(bad_hash, None)


@pytest.mark.parametrize(
    "bad_hash",
    [("", "YXNkYXNk", "sha512:YXNkYXNk", ":YXNkYXNk", "sha256:", ":", "sha256:///.")],
)
def fails_sign_of_bad_previous_hash(tmp_path: Path, bad_hash: str) -> None:
    """It should fail to sign a message hash that is not properly encoded."""
    manager = SigningKeyManager(tmp_path)
    with pytest.raises(LogSigningRequestError):
        manager.sign_hashpair(
            "sha256:uU0nuZNNPgilLlLX2n2r-sSE7-N6U4DukIj3rOLvzek=", bad_hash
        )
