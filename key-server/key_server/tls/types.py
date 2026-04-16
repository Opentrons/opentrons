"""Types for the TLS system as a whole."""

from dataclasses import dataclass
from datetime import datetime


@dataclass
class UnencryptedCert:
    """A certificate whose data is DER-encoded but not encrypted.

    All bytes fields in this object are urlsafe base64 encoded.
    """

    cert_data: bytes


@dataclass
class EncryptedCert:
    """A certificate whose data has been encrypted by a specific key.

    All bytes fields in this object are urlsafe base64 encoded.
    """

    cert_data: bytes
    key_salt: bytes
    key_expires_at: datetime
    kdf_iterations: int


@dataclass
class OldAndNewEncryptedCert:
    """Both the certificates."""

    current: EncryptedCert
    previous: EncryptedCert | None


@dataclass
class CertPassword:
    """The password that will be used to encrypt a certificate."""

    password: str
    valid_from_utc: datetime
    valid_until_utc: datetime
