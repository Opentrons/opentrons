"""An in-memory store for arbitrary client-defined JSON objects."""

from typing import Annotated

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
        self._current_data: dict[str, ClientData] = {}

    def put(self, key: str, new_data: ClientData) -> None:
        """Store new data at the given key, replacing any data that already exists."""
        self._current_data[key] = new_data

    def get(self, key: str) -> ClientData:
        """Return the currently-stored data.

        If the given key has no data, raise `KeyError`.
        """
        return self._current_data[key]

    def get_keys(self) -> list[str]:
        """Return the keys that currently have data stored."""
        return list(self._current_data.keys())

    def delete(self, key: str) -> None:
        """Delete the data at the given key.

        If the given key has no data, raise `KeyError`.
        """
        del self._current_data[key]

    def delete_all(self) -> None:
        """Delete all data from the store."""
        self._current_data.clear()


_app_state_accessor = AppStateAccessor[ClientDataStore]("client_data_store")


async def get_client_data_store(
    app_state: Annotated[AppState, fastapi.Depends(get_app_state)],
) -> ClientDataStore:
    """A FastAPI dependency to return the server's singleton `ClientDataStore`."""
    store = _app_state_accessor.get_from(app_state)
    if store is None:
        store = ClientDataStore()
        _app_state_accessor.set_on(app_state, store)
    return store
