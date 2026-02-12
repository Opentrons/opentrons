# noqa: D100

import enum
from typing import Final, Self


class Scope(enum.Enum):
    """OAuth 2 scopes for the robot's HTTP APIs.

    In other words, all the possible permissions that someone can have for interacting
    with the robot.
    """

    # Example:
    #
    # PYTHON_NAME = "api_name", "description"
    #
    # "PYTHON_NAME" is arbitrary.
    # "api_name" is exposed as part of the HTTP API, and may be stored persistently.
    # "description" is developer-readable documentation for the OpenAPI spec.

    # todo(mm, 2026-01-28): Replace these placeholder scopes with real ones.

    USERS_WRITE = (
        "users.write",
        "Read, write, and edit users.",
    )

    RUNS_READ = (
        "runs.read",
        "Retrieve information about protocol runs.",
    )

    RUNS_WRITE = (
        "runs.write",
        "Create and control protocol runs.",
    )

    _description: str

    def __new__(cls, api_name: str, description: str) -> Self:  # noqa: D102
        # https://docs.python.org/3/howto/enum.html#when-to-use-new-vs-init
        obj = object.__new__(cls)
        obj._value_ = api_name
        obj._description = description
        return obj

    @property
    def api_name(self) -> str:
        """The string that represents this scope in OAuth 2."""
        # __new__() messes with the type checking here.
        # This value is the _value_ set by __new__().
        return self.value  # type: ignore[no-any-return]

    @property
    def description(self) -> str:
        """The developer-readable documentation for this scope."""
        return self._description

    @classmethod
    def from_api_name(cls, api_name: str) -> Self:
        """Parse a string from OAuth 2 into the equivalent `Scope` member.

        Use this instead of `Scope(api_name)` for clarity.
        """
        try:
            # __new__() messes with the type checking here.
            return cls(api_name)  # type: ignore[call-arg]
        except ValueError:
            raise UnrecognizedScopeError(invalid_api_name=api_name) from None


def parse_scopes(scopes: str) -> set[Scope]:
    """Parse a space-separated scope list, as used in OAuth 2, into Python objects.

    https://datatracker.ietf.org/doc/html/rfc6749#section-3.3
    """
    return set(Scope.from_api_name(api_name) for api_name in scopes.split())


def serialize_scopes(scopes: set[Scope]) -> str:
    """Serialize scopes into a space-separated list, as used in OAuth 2.

    https://datatracker.ietf.org/doc/html/rfc6749#section-3.3
    """
    # Sorting isn't necessary for OAuth 2, but the stability helps with testing.
    return " ".join(sorted(scope.api_name for scope in scopes))


class UnrecognizedScopeError(ValueError):
    """Raised when trying to parse an unrecognized scope string."""

    def __init__(self, invalid_api_name: str) -> None:
        self.invalid_scope: Final[str] = invalid_api_name
        super().__init__(f"{repr(invalid_api_name)} is not a valid scope")
