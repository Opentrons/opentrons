"""Test log signing key utils."""

from pathlib import Path

import pytest
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from key_server.log_signing import key_utils


def test_load_or_ensure_writable_makes_dir(tmp_path: Path) -> None:
    """It should make the parent directory for keys."""
    assert (
        key_utils.load_or_ensure_writable(
            tmp_path / "some-key-dir" / "some-other-dir" / "key-file.der"
        )
        is None
    )
    assert (tmp_path / "some-key-dir" / "some-other-dir").is_dir()


def test_load_or_ensure_writable_handles_non_file(tmp_path: Path) -> None:
    """It should ignore things at the pathname that aren't files."""
    file = tmp_path / "keyfile.der"
    file.mkdir(parents=True, exist_ok=True)
    assert key_utils.load_or_ensure_writable(file) is None
    assert not file.exists()


def test_load_or_ensure_writable_handles_non_existing(tmp_path: Path) -> None:
    """It should handle the key file not existing."""
    file = tmp_path / "keyfile.der"
    assert key_utils.load_or_ensure_writable(file) is None
    assert not file.exists()


def test_load_or_ensure_writable_handles_non_der(tmp_path: Path) -> None:
    """It should handle a wrongly formatted key."""
    file = tmp_path / "keyfile.der"
    key = Ed25519PrivateKey.generate()
    file.write_bytes(
        key.private_bytes(
            serialization.Encoding.PEM,
            serialization.PrivateFormat.PKCS8,
            serialization.NoEncryption(),
        )
    )
    assert key_utils.load_or_ensure_writable(file) is None
    assert not file.exists()


def test_load_or_ensure_writable_handles_encrypted(tmp_path: Path) -> None:
    """It should handle an encrypted key."""
    file = tmp_path / "keyfile.der"
    key = Ed25519PrivateKey.generate()
    file.write_bytes(
        key.private_bytes(
            serialization.Encoding.DER,
            serialization.PrivateFormat.PKCS8,
            serialization.BestAvailableEncryption(b"hello"),
        )
    )
    assert key_utils.load_or_ensure_writable(file) is None
    assert not file.exists()


def test_load_or_ensure_writable_handles_wrong_key_kind(tmp_path: Path) -> None:
    """It should handle the wrong kind of key."""
    file = tmp_path / "keyfile.der"
    key = ec.generate_private_key(ec.SECP256R1())
    file.write_bytes(
        key.private_bytes(
            serialization.Encoding.DER,
            serialization.PrivateFormat.PKCS8,
            serialization.NoEncryption(),
        )
    )
    assert key_utils.load_or_ensure_writable(file) is None
    assert not file.exists()


def test_load_or_ensure_loads(tmp_path: Path) -> None:
    """It should load a properly-saved key."""
    file = tmp_path / "keyfile.der"
    key = Ed25519PrivateKey.generate()
    key_encoded_bytes = key.private_bytes(
        serialization.Encoding.DER,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    )
    file.write_bytes(key_encoded_bytes)
    loaded = key_utils.load_or_ensure_writable(file)
    assert loaded
    assert loaded.private_bytes_raw() == key.private_bytes_raw()
    assert file.exists()
    assert key_encoded_bytes == file.read_bytes()


def test_create_or_load_creates_if_cannot_load(tmp_path: Path) -> None:
    """It should create a key if the key cannot be loaded."""
    key = key_utils.create_or_load(tmp_path / "some-keyfile.der")
    assert isinstance(key, Ed25519PrivateKey)


def test_create_or_load_writes_created_key(tmp_path: Path) -> None:
    """It should write the key it created."""
    key_file = tmp_path / "some-keyfile.der"
    key = key_utils.create_or_load(key_file)

    load_key = serialization.load_der_private_key(key_file.read_bytes(), None)
    assert isinstance(load_key, Ed25519PrivateKey)
    assert key.private_bytes_raw() == load_key.private_bytes_raw()


def test_create_or_load_loads(tmp_path: Path) -> None:
    """It should load a properly-created key."""
    file = tmp_path / "keyfile.der"
    key = Ed25519PrivateKey.generate()
    key_encoded_bytes = key.private_bytes(
        serialization.Encoding.DER,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    )
    file.write_bytes(key_encoded_bytes)
    loaded = key_utils.create_or_load(file)
    assert loaded.private_bytes_raw() == key.private_bytes_raw()


def test_create_or_load_loads_own_creation(tmp_path: Path) -> None:
    """It should load a key it created on a subsequent call."""
    created_key = key_utils.create_or_load(tmp_path / "some-keyfile.der")
    loaded_key = key_utils.create_or_load(tmp_path / "some-keyfile.der")
    assert created_key.private_bytes_raw() == loaded_key.private_bytes_raw()


@pytest.mark.parametrize(
    "content",
    [
        pytest.param(
            b"",
            id="empty",
        ),
        pytest.param(
            b"\xaa",
            id="one",
        ),
        pytest.param(
            b"\xaa" * 32,
            id="small",
        ),
        pytest.param(
            b"\xaa" * (key_utils.HASH_CHUNK_SIZE - 1),
            id="one-under-chunk",
        ),
        pytest.param(b"\xaa" * key_utils.HASH_CHUNK_SIZE, id="exactly-chunk"),
        pytest.param(
            b"\xaa" * (key_utils.HASH_CHUNK_SIZE + 1),
            id="one-over-chunk",
        ),
        pytest.param(b"\xaa" * (key_utils.HASH_CHUNK_SIZE * 2), id="two-chunks"),
        pytest.param(b"\xaa" * (key_utils.HASH_CHUNK_SIZE * 10), id="ten-chunks"),
    ],
)
async def test_hashes_various_size_content(content: bytes) -> None:
    """It should correctly hash bytes of various sizes relative to the chunk size."""
    hasher = hashes.Hash(hashes.SHA256())
    hasher.update(content)
    oneshot = hasher.finalize()
    assert await key_utils.hash_content(content) == oneshot


def test_sign_hashpair_verifies() -> None:
    """It should generate a signature that can be verified"""
    key = Ed25519PrivateKey.generate()
    hash_1 = b"asdasdasd"
    hash_2 = b"lkjlkjlkj"
    content = hash_1 + hash_2
    signature = key_utils.sign_hashpair(hash_1, hash_2, key)
    public = key.public_key()
    public.verify(signature, content)
