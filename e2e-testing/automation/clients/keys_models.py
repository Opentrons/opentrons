"""Response models for key-server TLS certificate endpoints."""

from pydantic import BaseModel, Field


class EncryptedCertificate(BaseModel):
    """One CA certificate encrypted with a specific password-derived key."""

    cert_data: str = Field(description="URL-safe base64 Fernet token")
    key_salt: str = Field(description="URL-safe base64 PBKDF2 salt")
    key_expires_at: str
    kdf_iterations: int


class OldAndNewEncryptedCertificate(BaseModel):
    """Encrypted cert with current and optional previous password variants."""

    current: EncryptedCertificate
    previous: EncryptedCertificate | None = None


class EncryptedCACertificatesData(BaseModel):
    """CA certificates returned by GET /keys/external/ca/encryptedCerts."""

    current: OldAndNewEncryptedCertificate
    next: OldAndNewEncryptedCertificate | None = None


class EncryptedCACertificatesEnvelope(BaseModel):
    """JSON:API-style envelope for encrypted CA certificates."""

    data: EncryptedCACertificatesData


class UnencryptedCertificate(BaseModel):
    """Plaintext DER x509 certificate (URL-safe base64)."""

    cert_data: str


class PlaintextCACertificatesData(BaseModel):
    """CA certificates returned by GET /keys/external/ca/plaintextCerts."""

    current: UnencryptedCertificate
    next: UnencryptedCertificate | None = None


class PlaintextCACertificatesEnvelope(BaseModel):
    """JSON:API-style envelope for plaintext CA certificates."""

    data: PlaintextCACertificatesData
