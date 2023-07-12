"""Global application state.

We sometimes have singleton objects, like data stores and hardware controllers,
that we need to share across HTTP requests. We store these singletons on the
global application state object, which is provided to us by FastAPI and Starlette.

https://www.starlette.io/applications/#storing-state-on-the-app-instance

This module has helpers for working with the global application state object.
"""


from fastapi import Request, WebSocket
from starlette.datastructures import State as AppState  # Re-exported.
from typing import cast, Generic, Optional, TypeVar


async def get_app_state(
    # NOTE: both of these must be typed as non-optional to allow FastAPI's
    # dependency injection magic to work, but must have default values of
    # None in order to function at runtime, as only one will be present
    request: Request = cast(Request, None),
    websocket: WebSocket = cast(WebSocket, None),
) -> AppState:
    """Get the global application state object from the framework.

    Must be used with FastAPI's dependency injection system via fastapi.Depends.

    Arguments:
        request: The request object, injected by FastAPI. Will be `None` if the
            endpoint is a websocket endpoint.
        websocket: The websocket object, injected by FastAPI. Will be `None` if
            the endpoint is a regular HTTP endpoint.

    Returns:
        The global application state object.
        This is a dictionary-like bag of arbitrary attributes.
        See https://www.starlette.io/applications/#storing-state-on-the-app-instance.

        You can store and retrieve stuff on it directly, like `app_state.foo = 123`.
        But it's safer to do this through `AppStateAccessor`.
    """
    request_scope = request or websocket
    return cast(AppState, request_scope.app.state)


_ValueT = TypeVar("_ValueT")


class AppStateAccessor(Generic[_ValueT]):
    """A helper to store and retrieve values on an `AppState` in a type-safe way.

    Normally, `AppState` is a loosely-typed bag of attributes,
    which opens the door to silly mistakes:

    .. code-block::
        app_state.my_field = 123

        x = app_state.my_fild  # Typo, but not caught by type-checker.
        y: str = app_state.my_field  # Wrong type, but not caught by type-checker.

    With this class, this becomes:

    .. code-block::
        my_field = AppStateAccessor[int]("my_field")
        my_field.set_on(app_state, 123)

        x = my_fild.get_from(app_state)  # Type-checking error: misspelled variable.
        y: str = my_field.get_from(app_state)  # Type-checking error: not a str.

    Every singleton object you want to store on the `AppState` should get its own
    `AppStateAccessor`.
    """

    def __init__(self, key: str) -> None:
        """Initialize the `AppStateAccessor`.

        Arguments:
            key: Unique key on which to store the value. Must be
                unique across all keys used.
        """
        self._key = key

    def get_from(self, app_state: AppState) -> Optional[_ValueT]:
        """Retrieve the value previously stored on `app_state`.

        Return None if not present.
        """
        return cast(
            Optional[_ValueT],
            getattr(app_state, self._key, None),
        )

    def set_on(self, app_state: AppState, value: Optional[_ValueT]) -> None:
        """Store `value` on `app_state`."""
        setattr(app_state, self._key, value)


__all__ = ["AppState", "get_app_state", "AppStateAccessor"]
