"""Utilities for tavern testing."""
from tavern import response as Response  # type: ignore


def token_does_not_match(response: Response, token: str) -> None:
    """Validator to ensure two tokens do not match."""
    assert response.json().get("token") != token
