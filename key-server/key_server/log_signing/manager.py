"""Code for managing log signing keys."""

import base64
from pathlib import Path
from typing import Final, Literal, Set, TypeVar, Union, cast

from .key_utils import create_or_load, get_public_key_pem, hash_content, sign_hashpair
from .types import LogSigningRequestError

KEY_FILENAME: Final = "audit-signing-key.private"
HashAlgorithms = Literal["sha256"]
HASH_ALGORITHMS: Set[HashAlgorithms] = {"sha256"}
SignatureAlgorithms = Literal["ed25519"]
SIGNATURE_ALGORITHMS: Set[SignatureAlgorithms] = {"ed25519"}
Algorithms = Union[HashAlgorithms, SignatureAlgorithms]


class SigningKeyManager:
    """A class for managing and ensuring the presence of log signing keys.

    Cryptographic data (hash values and signature values) are encoded in this class's
    interface for sending over text channels like HTTP. In general, they're encoded as
    "algName:b64value", where algName is the name of the relevant hash or signature algorithm
    and b64value is the url-safe base64 encoding of the bytes.
    """

    def __init__(self, key_dir: Path) -> None:
        """Build a signing key manager."""
        self._key = create_or_load(key_dir / KEY_FILENAME)

    @property
    def implemented_version(self) -> Literal[1]:
        """The version of log message signing implemented here.

        Version 1:
        - Messages must be encodable in UTF-8 without character replacement; messages that cannot
          be encoded to UTF-8 are rejected with an error
        - The hash algorithms used and accepted are SHA-256
        - The signature is over message_hash + previous_hash
        - If previous_hash is None, it is taken to be b'' when signed (so the signature is only of
          message_hash)
        - The signature is Ed25519 with the robot's signing key
        - The signing key is not rotated
        - The signing key is not presented as an x509 certificate and carries only cryptographic data,
          no identity or other metadata
        """
        return 1

    @property
    def hash_alg(self) -> Literal["sha256"]:
        """The hash algorithm supported by this version."""
        return "sha256"

    @property
    def signature_alg(self) -> Literal["ed25519"]:
        """The signature algorithm used here."""
        return "ed25519"

    async def hash_message(self, message: str) -> str:
        """Hash a message.

        The message plaintext should be provided. The hash algorithm used is sha256. The
        returned hash is encoded as in the class docstring.
        """
        try:
            message_bytes = message.encode("utf-8")
        except UnicodeEncodeError:
            raise LogSigningRequestError(
                "Invalid message: cannot be represented as UTF-8"
            )
        hashval = await hash_content(message_bytes)
        return _encode_crypt_val(self.hash_alg, hashval)

    def sign_hashpair(self, message_hash: str, previous_hash: str | None) -> str:
        """Sign a pair of message and previous-message hashes.

        The hashes should be encoded per the docstring. The only accepted hash algorithm is
        sha256. The signature algorithm is Ed25519 and will be encoded in the return
        downcased, e.g. ed25519.
        """
        _, message_hash_bytes = _decode_crypt_val({self.hash_alg}, message_hash)
        _, previous_hash_bytes = (
            _decode_crypt_val({self.hash_alg}, previous_hash)
            if previous_hash is not None
            else ("", b"")
        )
        signature_bytes = sign_hashpair(
            message_hash_bytes, previous_hash_bytes, self._key
        )
        return _encode_crypt_val(self.signature_alg, signature_bytes)

    def get_public_key_pem(self) -> str:
        """Get the PEM-encoded public side of the signing key."""
        key_pem = get_public_key_pem(self._key)
        return key_pem.decode("utf-8")


_Alg = TypeVar("_Alg", HashAlgorithms, SignatureAlgorithms)


def _check_alg(
    required_algorithms: Set[_Alg],
    alg: str,
) -> _Alg:
    if alg not in required_algorithms:
        raise LogSigningRequestError(
            f"Invalid crypt value: specified algorithm {alg} but only {', '.join(required_algorithms)} are allowed"
        )
    return cast(_Alg, alg)


def _decode_crypt_val(
    required_algorithms: Set[_Alg],
    encoded: str,
) -> tuple[_Alg, bytes]:
    components = encoded.split(":")
    if len(components) != 2:
        raise LogSigningRequestError(
            "Invalid crypt value: not formatted as algorithm:encodedValue"
        )
    alg = _check_alg(required_algorithms, components[0])
    value = components[1]

    try:
        value_bytes = base64.urlsafe_b64decode(value)
    except Exception as e:
        raise LogSigningRequestError(
            "Invalid crypt value: no have a url-safe base64 encoded value"
        ) from e
    return alg, value_bytes


def _encode_crypt_val(algorithm: Algorithms, content: bytes) -> str:
    encoded_content = base64.urlsafe_b64encode(content).decode("utf-8")
    return f"{algorithm}:{encoded_content}"
