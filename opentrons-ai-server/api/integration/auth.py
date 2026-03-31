import asyncio
from typing import cast

import jwt
import structlog
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer, SecurityScopes

from api.models.user import User
from api.settings import Settings, get_settings

settings: Settings = get_settings()
logger = structlog.stdlib.get_logger(settings.logger_name)

EMAIL_NOT_VERIFIED_DETAIL = "Email address has not been verified. Please check your inbox and verify your email before continuing."


class UnauthenticatedException(HTTPException):
    def __init__(self, detail: str = "This request was not authorized correctly.") -> None:
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


class VerifyToken:
    """Does all the token verification using PyJWT"""

    def __init__(self) -> None:
        self.config = get_settings()

        # This gets the JWKS from a given URL and does processing so you can
        # use any of the keys available
        jwks_url = f"https://{self.config.auth0_domain}/.well-known/jwks.json"
        self.jwks_client = jwt.PyJWKClient(jwks_url)

    async def verify(
        self,
        security_scopes: SecurityScopes,
        credentials: HTTPAuthorizationCredentials = Security(HTTPBearer()),  # noqa: B008
    ) -> User:
        if credentials is None:
            raise UnauthenticatedException()

        try:
            jwk = await asyncio.to_thread(self.jwks_client.get_signing_key_from_jwt, credentials.credentials)
            signing_key = jwk.key
        except jwt.PyJWKClientError as error:
            logger.error("JWT client error", exc_info=True)
            raise UnauthenticatedException() from error
        except jwt.exceptions.DecodeError as error:
            logger.error("JWT decode error", exc_info=True)
            raise UnauthenticatedException() from error

        try:
            payload = jwt.decode(
                credentials.credentials,
                signing_key,
                algorithms=[self.config.auth0_algorithms],
                audience=self.config.auth0_api_audience,
                issuer=self.config.auth0_issuer,
            )
            user = User(**payload)
            if not cast(bool, user.m2m) and not user.email_verified:
                logger.warning("Rejected unverified email", extra={"sub": user.sub})
                raise UnauthenticatedException(detail=EMAIL_NOT_VERIFIED_DETAIL)
            structlog.contextvars.bind_contextvars(user_id=user.sub)
            logger.info("User authenticated", extra={"is_m2m": user.m2m})
            return user
        except jwt.ExpiredSignatureError:
            logger.error("JWT expired", exc_info=True)
            # Handle token expiration, e.g., refresh token, re-authenticate, etc.
        except jwt.PyJWTError:
            logger.error("JWT validation error", exc_info=True)
            # Handle other JWT errors
        raise UnauthenticatedException()
