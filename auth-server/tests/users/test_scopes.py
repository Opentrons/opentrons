import pytest

from auth_server.users.scopes import Scope


@pytest.mark.parametrize("scope", Scope)
def test_no_invalid_characters_in_scope(scope: Scope) -> None:
    """Make sure that each scope's string uses only the characters allowed by RFC 6749.

    oauthlib doesn't seem to validate this itself.
    """
    # https://datatracker.ietf.org/doc/html/rfc6749#section-3.3
    assert len(str(scope)) >= 1
    for c in str(scope):
        assert ord(c) == 0x21 or 0x23 <= ord(c) <= 0x5B or 0x5D <= ord(c) <= 0x7E, (
            f"Invalid character: {c}"
        )
