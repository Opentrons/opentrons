from opentrons import ThreadManager

from robot_server.service.session import models
from robot_server.service.session.errors import UnsupportedCommandException
from robot_server.service.session.session_types.live_protocol.state_store import \
    StateStore


class CommandInterface:

    def __init__(self, hardware: ThreadManager, state_store: StateStore):
        self._hardware = hardware
        self._state_store = state_store

    async def handle_load_labware(self, command: models.LoadLabwareRequest) -> models.LoadLabwareResponse:
        raise UnsupportedCommandException("")

    async def handle_load_instrument(self, command: models.LoadInstrumentRequest) -> models.LoadLabwareResponse:
        raise UnsupportedCommandException("")

    async def handle_aspirate(self, command):
        raise UnsupportedCommandException("")

    async def handle_dispense(self, command):
        raise UnsupportedCommandException("")

    async def handle_pick_up_tip(self, command):
        raise UnsupportedCommandException("")

    async def handle_drop_tip(self, command):
        raise UnsupportedCommandException("")
