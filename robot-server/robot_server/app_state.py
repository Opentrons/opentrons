"""Global application state.

Mostly, this serves as a place to store singletons as well as
in-memory databases.
"""
from fastapi import Request, WebSocket
from starlette.datastructures import State as AppState


async def get_app_state(
    request: Request = None,
    websocket: WebSocket = None,
) -> AppState:
    """Get the global application's state from the framework.

    Muse be used with FastAPI's dependency injection system via fastapi.Depends.

    See https://www.starlette.io/applications/#storing-state-on-the-app-instance
    for more details about the application state object.

    Arguments:
        request: The request object, injected by FastAPI. Will be `None` if the
            endpoint is a websocket endpoint.
        websocket: The websocket object, injected by FastAPI. Will be `None` if
            the endpoint is a regular HTTP endpoint.

    Returns:
        A dictionary-like object containing global application state.
    """
    request_scope = request or websocket
    return request_scope.app.state  # type: ignore[union-attr]


__all__ = ["AppState", "get_app_state"]
