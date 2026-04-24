from typing import Any, List, Optional, Union

from pydantic import BaseModel, Field, computed_field, model_validator

# Namespaced custom claim injected by the Auth0 Post-Login Action.
# Auth0 requires custom claims to use a namespace URL to avoid collisions.
EMAIL_VERIFIED_CLAIM = "https://opentrons.com/email_verified"

# Auth0 machine-to-machine (client_credentials) tokens have a subject that ends
# with "@clients".  These tokens are issued to trusted backend services, not human
# users, so email verification does not apply to them.
M2M_SUBJECT_SUFFIX = "@clients"


class User(BaseModel):
    aud: Union[str, List[str]] = Field(..., description="Audience URL(s)")
    azp: str = Field(..., description="Authorized party ID")
    exp: int = Field(..., description="Expiration timestamp")
    iat: int = Field(..., description="Issued-at timestamp")
    iss: str = Field(..., description="Issuer URL")
    scope: Optional[str] = Field(None, description="Space-separated scopes")
    sub: str = Field(..., description="Subject identifier for the token")
    email_verified: bool = Field(False, description="Whether the user's email address has been verified")

    # Keep this allow because we may have additional claims in the future for other applications
    # from Auth0 and we don't want that to break this User model.
    model_config = {"extra": "allow"}

    @model_validator(mode="before")
    @classmethod
    def _normalize_email_verified_claim(cls, data: Any) -> Any:
        """Normalize Auth0 namespaced email_verified claim and set False for M2M users."""
        if not isinstance(data, dict):
            return data
        if EMAIL_VERIFIED_CLAIM in data:
            # Auth0 sends a boolean under the namespaced claim; expose it as email_verified.
            # Use that boolean value to set the email_verified field.
            # BUT we don't need to remove the claim because we are keeping the allow extra.
            data["email_verified"] = bool(data[EMAIL_VERIFIED_CLAIM])
        if data.get("sub", "").endswith(M2M_SUBJECT_SUFFIX):
            # M2M (client_credentials) tokens bypass the email-verification check because
            # they represent trusted backend services, not human users.
            data["email_verified"] = False
        return data

    @computed_field
    def m2m(self) -> bool:
        """True if this token is machine-to-machine (client_credentials), not a human user."""
        return self.sub.endswith(M2M_SUBJECT_SUFFIX)
