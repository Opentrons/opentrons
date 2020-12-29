import logging

from opentrons import ThreadManager
from robot_server.service.session.models import command as models
from robot_server.service.session.errors import UnsupportedCommandException
from robot_server.service.session.models.common import create_identifier
from robot_server.service.session.session_types.live_protocol.state_store\
    import StateStore
from opentrons.protocol_api.labware import get_labware_definition
from opentrons.calibration_storage import helpers, get


log = logging.getLogger(__name__)


class ProtocolErrorInstrument(Exception):
    pass


class CommandInterface:

    def __init__(self, hardware: ThreadManager, state_store: StateStore):
        self._hardware = hardware
        self._state_store = state_store

    async def handle_load_labware(
            self,
            command: models.LoadLabwareRequestData) ->\
            models.LoadLabwareResponseData:

        labware_def = get_labware_definition(load_name=command.loadName,
                                             namespace=command.namespace,
                                             version=command.version)
        # TODO (spp, 09-22-2020): update calibration fetching code
        labware_path = f'{helpers.hash_labware_def(labware_def)}.json'
        calibration = get.get_labware_calibration(labware_path, labware_def,
                                                  '')
        return models.LoadLabwareResponseData(labwareId=create_identifier(),
                                              definition=labware_def,
                                              calibration=calibration)

    async def handle_load_instrument(
            self,
            command: models.LoadInstrumentRequestData) \
            -> models.LoadInstrumentResponseData:
        """Load an instrument while checking if it is connected"""
        mount = command.mount
        other_mount = mount.other_mount()

        # Retrieve existing instrument on the other mount.
        other_instrument = self._state_store.get_instrument_by_mount(
            other_mount.to_hw_mount()
        )

        # Create the cache instrument request including other mount and mount
        # requested by command
        cache_request = {
            mount.to_hw_mount(): command.instrumentName,
            other_mount.to_hw_mount(): other_instrument
        }
        try:
            self._hardware.cache_instruments(cache_request)
        except RuntimeError as e:
            log.exception("Failed to cache_instruments")
            raise ProtocolErrorInstrument(str(e))

        return models.LoadInstrumentResponseData(
            instrumentId=create_identifier())

    async def handle_aspirate(self, command: models.PipetteRequestDataBase):
        raise UnsupportedCommandException("")

    async def handle_dispense(self, command: models.PipetteRequestDataBase):
        raise UnsupportedCommandException("")

    async def handle_pick_up_tip(self, command: models.PipetteRequestDataBase):
        raise UnsupportedCommandException("")

    async def handle_drop_tip(self, command: models.PipetteRequestDataBase):
        raise UnsupportedCommandException("")
