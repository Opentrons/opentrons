from base64 import urlsafe_b64decode
from typing import Any, Optional
from urllib.parse import urlparse

import httpx
import jwt
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPublicNumbers
from jwt.exceptions import DecodeError, ExpiredSignatureError, InvalidTokenError
from rich import print

from tests.helpers.settings import Settings


class TokenVerifier:
    def __init__(self, settings: Settings) -> None:
        self.settings: Settings = settings

    def _get_issuer(self) -> str:
        parsed_url = urlparse(self.settings.TOKEN_URL)
        return f"{parsed_url.scheme}://{parsed_url.netloc}/"

    def _ensure_bytes(self, value: str) -> str:
        """Ensures the decoded Base64 values are correctly padded."""
        return value + "=" * (-len(value) % 4)

    def _fetch_jwks(self, jwks_url: str) -> Any:
        """Fetches the JWKS using HTTPX."""
        with httpx.Client() as client:
            response = client.get(jwks_url)
            response.raise_for_status()
            return response.json()

    def _decode_key(self, jwk: Any) -> str:
        """Converts a JWK to a PEM formatted public key."""
        e = urlsafe_b64decode(self._ensure_bytes(jwk["e"]))
        n = urlsafe_b64decode(self._ensure_bytes(jwk["n"]))

        public_numbers = RSAPublicNumbers(int.from_bytes(e, "big"), int.from_bytes(n, "big"))
        public_key = public_numbers.public_key(default_backend())
        pem = public_key.public_bytes(encoding=serialization.Encoding.PEM, format=serialization.PublicFormat.SubjectPublicKeyInfo)
        return pem.decode("utf-8")

    def _get_kid_from_jwt(self, token: str) -> Optional[str]:
        """Extract the 'kid' from JWT header without verifying the token."""
        unverified_header = jwt.get_unverified_header(token)
        return unverified_header.get("kid")

    def is_valid_token(self, token: str) -> bool:
        """Check if the token is valid using the JWKS endpoint."""
        if not token:
            return False
        jwks_url = f"{self._get_issuer()}.well-known/jwks.json"
        kid = self._get_kid_from_jwt(token)
        jwks = self._fetch_jwks(jwks_url)
        key = next((key for key in jwks["keys"] if key["kid"] == kid), None)
        if key is None:
            return False

        try:
            decoded_token = jwt.decode(
                token,
                key=self._decode_key(key),
                algorithms=["RS256"],
                issuer=self._get_issuer(),
                audience=self.settings.AUDIENCE,
                options={"verify_signature": True},
            )
            print("Decoded token:")
            print(decoded_token)
            return True
        except (DecodeError, ExpiredSignatureError, InvalidTokenError) as e:
            print(f"JWT validation error: {str(e)}")
            return False
