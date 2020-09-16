from robot_server.service.session import models
from robot_server.service.session.errors import UnsupportedCommandException


class CommandInterface:

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
