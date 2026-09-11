import asyncio
import shutil
from logging import getLogger
from pathlib import Path
from typing import Final

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

LOG = getLogger(__name__)
HASH_CHUNK_SIZE: Final = 1024


def create_or_load(key_path: Path) -> Ed25519PrivateKey:
    """Load a key, if it exists, or create one.

    Keys must be saved as PKCS8 in a DER format without encryption. This means they should only
    be saved in a secure location.
    """
    maybe_key = load_or_ensure_writable(key_path)
    if not maybe_key:
        key = Ed25519PrivateKey.generate()
        key_path.write_bytes(
            key.private_bytes(
                serialization.Encoding.DER,
                serialization.PrivateFormat.PKCS8,
                serialization.NoEncryption(),
            )
        )
        LOG.info("created and saved signing key")
        return key
    return maybe_key


def load_or_ensure_writable(key_path: Path) -> Ed25519PrivateKey | None:
    """Load a key from the path or make sure the key path can have new contents written to it.

    If the key can be loaded, load it and return it. Otherwise, make sure the directory to the
    file exists and if it existed but was invalid, delete it to make sure a new one can be saved.
    """
    key_path.parent.mkdir(parents=True, exist_ok=True)

    if not key_path.is_file() or key_path.is_symlink():
        if key_path.exists():
            if key_path.is_symlink():
                key_path.unlink()
            if key_path.is_dir():
                shutil.rmtree(key_path)
            else:
                key_path.unlink()
            LOG.error("cannot load signing key file: is not file")
        else:
            LOG.error("cannot load signing key file: does not exist")
        return None
    try:
        key_bytes = key_path.read_bytes()
    except BaseException:
        LOG.exception("cannot load signing key file: could not read bytes")
        key_path.unlink()
        return None
    try:
        key = serialization.load_der_private_key(key_bytes, None)
        assert isinstance(key, Ed25519PrivateKey)
    except BaseException:
        LOG.exception(
            "cannot load signing key file: could not parse as DER-encoded ED25519 key"
        )
        key_path.unlink()
        return None
    LOG.info("loaded signing key from file")
    return key


async def hash_content(data: bytes) -> bytes:
    """Hash some content with SHA-256."""
    hasher = hashes.Hash(hashes.SHA256())
    cursor = 0
    while cursor < len(data):
        chunk_end = cursor + min(HASH_CHUNK_SIZE, len(data))
        hasher.update(data[cursor:chunk_end])
        cursor = chunk_end
        await asyncio.sleep(0)
    return hasher.finalize()


def sign_hashpair(hash_1: bytes, hash_2: bytes, key: Ed25519PrivateKey) -> bytes:
    """Sign a pair of hashes with the Ed25519 key provided."""
    message = hash_1 + hash_2
    return key.sign(message)


def get_public_key_pem(key: Ed25519PrivateKey) -> bytes:
    """Get the public key, encoded in PEM."""
    public_key = key.public_key()
    return public_key.public_bytes(
        serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo
    )
