"""An in-memory store for arbitrary client-defined JSON objects."""

import fastapi

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)


ClientData = dict[str, object]


class ClientDataStore:
    """An in-memory store for client-defined JSON objects."""

    def __init__(self) -> None:
        self._current_data: ClientData = {}

    def put(self, new_data: ClientData) -> None:
        """Replace the stored data."""
        self._current_data = new_data

    def get(self) -> ClientData:
        """Return the currently-stored data."""
        return self._current_data


_app_state_accessor = AppStateAccessor[ClientDataStore]("client_data_store")


async def get_client_data_store(
    app_state: AppState = fastapi.Depends(get_app_state),
) -> ClientDataStore:
    """A FastAPI dependency to return the server's singleton `ClientDataStore`."""
    store = _app_state_accessor.get_from(app_state)
    if store is None:
        store = ClientDataStore()
        _app_state_accessor.set_on(app_state, store)
    return store
