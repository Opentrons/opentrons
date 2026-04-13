"""Unit tests for email verification enforcement in VerifyToken.verify()."""

import asyncio
from typing import Any, cast
from unittest.mock import MagicMock, patch

import pytest
from api.integration.auth import (
    EMAIL_NOT_VERIFIED_DETAIL,
    UnauthenticatedException,
    VerifyToken,
)
from api.models.user import EMAIL_VERIFIED_CLAIM, M2M_SUBJECT_SUFFIX, User

# ---------------------------------------------------------------------------
# Shared fixture data
# ---------------------------------------------------------------------------

BASE_PAYLOAD: dict[str, Any] = {
    "aud": "sandbox-ai-api",
    "azp": "test_azp",
    "exp": 9999999999,
    "iat": 1234567890,
    "iss": "https://test.auth0.com/",
    "sub": "auth0|testuser",
}

# M2M (client_credentials) tokens always have sub ending in "@clients"
M2M_PAYLOAD: dict[str, Any] = {
    **BASE_PAYLOAD,
    "sub": f"E1UZpoA7KokaizT3RlGldl5q3VPur9Py{M2M_SUBJECT_SUFFIX}",
    "gty": "client-credentials",
}


# ---------------------------------------------------------------------------
# User model tests
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_user_model_email_verified_defaults_to_false() -> None:
    """email_verified should default to False when the claim is absent."""
    user = User(**BASE_PAYLOAD)
    assert user.email_verified is False


@pytest.mark.unit
def test_user_model_email_verified_explicit_true() -> None:
    user = User(**{**BASE_PAYLOAD, "email_verified": True})
    assert user.email_verified is True


@pytest.mark.unit
def test_user_model_email_verified_explicit_false() -> None:
    user = User(**{**BASE_PAYLOAD, "email_verified": False})
    assert user.email_verified is False


@pytest.mark.unit
def test_user_model_normalizes_namespaced_claim() -> None:
    """User model should normalize EMAIL_VERIFIED_CLAIM into email_verified."""
    user = User(**{**BASE_PAYLOAD, EMAIL_VERIFIED_CLAIM: True})
    assert user.email_verified is True


@pytest.mark.unit
def test_user_model_m2m_false_for_human_user() -> None:
    user = User(**BASE_PAYLOAD)
    assert cast(bool, user.m2m) is False


@pytest.mark.unit
def test_user_model_m2m_true_for_client_credentials() -> None:
    user = User(**M2M_PAYLOAD)
    assert cast(bool, user.m2m) is True
    assert user.email_verified is False  # M2M users always get email_verified=False


# ---------------------------------------------------------------------------
# UnauthenticatedException tests
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_unauthenticated_exception_default_detail() -> None:
    exc = UnauthenticatedException()
    assert exc.status_code == 401
    assert exc.detail == "This request was not authorized correctly."


@pytest.mark.unit
def test_unauthenticated_exception_custom_detail() -> None:
    exc = UnauthenticatedException(detail=EMAIL_NOT_VERIFIED_DETAIL)
    assert exc.status_code == 401
    assert "not been verified" in exc.detail


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_verify_token() -> tuple[VerifyToken, MagicMock, MagicMock]:
    """Return a VerifyToken instance with a mocked JWKS client."""
    with patch("api.integration.auth.jwt.PyJWKClient") as mock_jwks_class:
        mock_signing_key = MagicMock()
        mock_signing_key.key = "test_key"
        mock_jwks_instance = MagicMock()
        mock_jwks_instance.get_signing_key_from_jwt.return_value = mock_signing_key
        mock_jwks_class.return_value = mock_jwks_instance
        verify_token = VerifyToken()
    return verify_token, mock_jwks_instance, mock_signing_key


def _run_verify(verify_token: VerifyToken, payload: dict[str, Any]) -> Any:
    """Run verify() synchronously with a mocked jwt.decode."""
    credentials = MagicMock()
    credentials.credentials = "test_token"
    security_scopes = MagicMock()
    with patch("api.integration.auth.jwt.decode", return_value=payload):
        return asyncio.run(verify_token.verify(security_scopes, credentials))


# ---------------------------------------------------------------------------
# VerifyToken.verify() — email_verified enforcement
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_verify_rejects_unverified_email() -> None:
    """A token with email_verified=False must raise UnauthenticatedException."""
    verify_token, _, _ = _make_verify_token()
    unverified_payload = {**BASE_PAYLOAD, "email_verified": False}

    with pytest.raises(UnauthenticatedException) as exc_info:
        _run_verify(verify_token, unverified_payload)

    assert exc_info.value.status_code == 401
    assert "not been verified" in str(exc_info.value.detail)


@pytest.mark.unit
def test_verify_accepts_verified_email() -> None:
    """A token with email_verified=True must succeed and return a User."""
    verify_token, _, _ = _make_verify_token()
    verified_payload = {**BASE_PAYLOAD, "email_verified": True}

    user = _run_verify(verify_token, verified_payload)

    assert isinstance(user, User)
    assert user.email_verified is True
    assert user.sub == "auth0|testuser"


@pytest.mark.unit
def test_verify_rejects_missing_email_verified_claim() -> None:
    """When email_verified is absent the default is False and the request is rejected."""
    verify_token, _, _ = _make_verify_token()

    with pytest.raises(UnauthenticatedException) as exc_info:
        _run_verify(verify_token, dict(BASE_PAYLOAD))

    assert "not been verified" in str(exc_info.value.detail)


@pytest.mark.unit
def test_verify_normalizes_namespaced_claim_false() -> None:
    """The Auth0 namespaced claim should be normalized; False must be rejected."""
    verify_token, _, _ = _make_verify_token()
    namespaced_payload = {**BASE_PAYLOAD, EMAIL_VERIFIED_CLAIM: False}

    with pytest.raises(UnauthenticatedException) as exc_info:
        _run_verify(verify_token, namespaced_payload)

    assert "not been verified" in str(exc_info.value.detail)


@pytest.mark.unit
def test_verify_normalizes_namespaced_claim_true() -> None:
    """The Auth0 namespaced claim should be normalized; True must be accepted."""
    verify_token, _, _ = _make_verify_token()
    namespaced_payload = {**BASE_PAYLOAD, EMAIL_VERIFIED_CLAIM: True}

    user = _run_verify(verify_token, namespaced_payload)

    assert user.email_verified is True


# ---------------------------------------------------------------------------
# VerifyToken.verify() — M2M (machine-to-machine) bypass
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_verify_allows_m2m_token_without_email_verified() -> None:
    """M2M tokens (sub ends with @clients) must be allowed even when email_verified is absent.

    Auth0 client_credentials tokens are issued to trusted backend services.
    They never pass through the Post-Login Action, so they will never carry the
    email_verified claim.  Blocking them would break all server-to-server API calls.
    """
    verify_token, _, _ = _make_verify_token()

    user = _run_verify(verify_token, dict(M2M_PAYLOAD))

    assert user.m2m is True
    assert user.email_verified is False  # absent → default False, but still allowed


@pytest.mark.unit
def test_verify_allows_m2m_token_with_email_verified_false() -> None:
    """M2M tokens are allowed regardless of the email_verified value."""
    verify_token, _, _ = _make_verify_token()
    payload = {**M2M_PAYLOAD, "email_verified": False}

    user = _run_verify(verify_token, payload)

    assert user.m2m is True


@pytest.mark.unit
def test_verify_still_rejects_user_token_without_email_verified() -> None:
    """The M2M bypass must not apply to regular user tokens."""
    verify_token, _, _ = _make_verify_token()

    with pytest.raises(UnauthenticatedException) as exc_info:
        _run_verify(verify_token, dict(BASE_PAYLOAD))

    assert "not been verified" in str(exc_info.value.detail)
