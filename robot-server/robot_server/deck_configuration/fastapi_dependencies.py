"""Dependency functions for use with `fastapi.Depends()`."""


import fastapi

from opentrons.protocol_engine.types import DeckType
from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)

from robot_server.deck_configuration.store import DeckConfigurationStore
from robot_server.hardware import get_deck_type


_accessor = AppStateAccessor[DeckConfigurationStore]("deck_configuration_store")


async def get_deck_configuration_store(
    app_state: AppState = fastapi.Depends(get_app_state),
    deck_type: DeckType = fastapi.Depends(get_deck_type),
) -> DeckConfigurationStore:
    """Return the server's singleton `DeckConfigurationStore`."""
    deck_configuration_store = _accessor.get_from(app_state)
    if deck_configuration_store is None:
        # If this initialization becomes async, we will need to protect it with a lock,
        # to protect against the bug described in https://github.com/Opentrons/opentrons/pull/11927.
        deck_configuration_store = DeckConfigurationStore(deck_type)
        _accessor.set_on(app_state, deck_configuration_store)
    return deck_configuration_store
