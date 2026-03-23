import pytest

from server_utils.auth.scopes import (
    Scope,
    UnrecognizedScopeError,
    parse_scopes,
    serialize_scopes,
)


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


def test_parse() -> None:
    assert parse_scopes("") == set()

    assert parse_scopes("robot_control.write users.write") == {
        Scope.ROBOT_CONTROL_WRITE,
        Scope.USERS_WRITE,
    }

    with pytest.raises(UnrecognizedScopeError) as exception:
        parse_scopes("these are not valid scopes")
    assert exception.value.invalid_scope == "these"


def test_serialize() -> None:
    assert serialize_scopes(set()) == ""

    assert (
        serialize_scopes({Scope.ROBOT_CONTROL_WRITE, Scope.USERS_WRITE})
        == "robot_control.write users.write"
    )
    assert (
        serialize_scopes({Scope.USERS_WRITE, Scope.ROBOT_CONTROL_WRITE})
        == "robot_control.write users.write"
    )
