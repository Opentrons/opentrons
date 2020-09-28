from opentrons import ThreadManager

from robot_server.service.session.models import command as models
from robot_server.service.session.errors import UnsupportedCommandException
from robot_server.service.session.models.common import create_identifier
from robot_server.service.session.session_types.live_protocol.state_store\
    import StateStore
from opentrons.protocol_api.labware import get_labware_definition
from opentrons.calibration_storage import helpers, get


class CommandInterface:

    def __init__(self, hardware: ThreadManager, state_store: StateStore):
        self._hardware = hardware
        self._state_store = state_store

    async def handle_load_labware(
            self,
            command: models.LoadLabwareRequest) -> models.LoadLabwareResponse:

        labware_def = get_labware_definition(load_name=command.loadName,
                                             namespace=command.namespace,
                                             version=command.version)
        # TODO (spp, 09-22-2020): update calibration fetching code
        labware_path = f'{helpers.hash_labware_def(labware_def)}.json'
        calibration = get.get_labware_calibration(labware_path, labware_def,
                                                  '')
        return models.LoadLabwareResponse(labwareId=create_identifier(),
                                          definition=labware_def,
                                          calibration=calibration)

    async def handle_load_instrument(
            self,
            command: models.LoadInstrumentRequest) \
            -> models.LoadLabwareResponse:
        raise UnsupportedCommandException("")

    async def handle_aspirate(self, command: models.PipetteRequestBase):
        raise UnsupportedCommandException("")

    async def handle_dispense(self, command: models.PipetteRequestBase):
        raise UnsupportedCommandException("")

    async def handle_pick_up_tip(self, command: models.PipetteRequestBase):
        raise UnsupportedCommandException("")

    async def handle_drop_tip(self, command: models.PipetteRequestBase):
        raise UnsupportedCommandException("")
