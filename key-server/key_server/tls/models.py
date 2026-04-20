"""Types for the TLS system as a whole."""

from datetime import datetime

import pydantic


class _StrictBaseModel(pydantic.BaseModel):
    model_config = {"strict": True}


class UnencryptedCert(_StrictBaseModel):
    """A certificate whose data is DER-encoded but not encrypted.

    All bytes fields in this object are urlsafe base64 encoded.
    """

    cert_data: bytes


class EncryptedCert(_StrictBaseModel):
    """A certificate whose data has been encrypted by a specific key.

    All bytes fields in this object are urlsafe base64 encoded.
    """

    cert_data: bytes
    key_salt: bytes
    key_expires_at: datetime
    kdf_iterations: int


class OldAndNewEncryptedCert(_StrictBaseModel):
    """A certificate encrypted with the current and previous (if it exists) passwords."""

    current: EncryptedCert
    previous: EncryptedCert | None


class CertPassword(_StrictBaseModel):
    """The password that will be used to encrypt a certificate."""

    password: str
    valid_from_utc: datetime
    valid_until_utc: datetime


class EncryptedCACertificates(_StrictBaseModel):
    """The CA certificates the robot uses, encrypted with Fernet."""

    current: OldAndNewEncryptedCert
    next: OldAndNewEncryptedCert | None


class PlaintextCACertificates(_StrictBaseModel):
    """The CA certificates the robot uses, unencrypted."""

    current: UnencryptedCert
    next: UnencryptedCert | None
