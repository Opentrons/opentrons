"""Equipment command side-effect logic."""
from opentrons.types import Mount
from opentrons.hardware_control.api import API as HardwareAPI

from ..errors import FailedToLoadPipetteError
from ..resources import IdGenerator, LabwareData
from ..state import State
from ..command_models import (
    LoadLabwareRequest,
    LoadLabwareResult,
    LoadPipetteRequest,
    LoadPipetteResult
)


class EquipmentHandler():
    _hardware: HardwareAPI
    _id_generator: IdGenerator
    _labware_data: LabwareData

    def __init__(self, hardware, id_generator=None, labware_data=None):
        self._hardware = hardware

        self._id_generator = (
            id_generator if id_generator is not None else IdGenerator()
        )
        self._labware_data = (
            labware_data if labware_data is not None else LabwareData()
        )

    async def handle_load_labware(
        self,
        request: LoadLabwareRequest
    ) -> LoadLabwareResult:
        labware_id = self._id_generator.generate_id()
        labware_def = await self._labware_data.get_labware_definition(
            load_name=request.loadName,
            namespace=request.namespace,
            version=request.version
        )
        cal_data = await self._labware_data.get_labware_calibration(
            definition=labware_def,
            location=request.location,
        )

        return LoadLabwareResult(
            labwareId=labware_id,
            definition=labware_def,
            calibration=cal_data
        )

    async def handle_load_pipette(
        self,
        request: LoadPipetteRequest,
        state: State
    ) -> LoadPipetteResult:
        mount = request.mount
        other_mount = Mount.LEFT if mount == Mount.RIGHT else Mount.RIGHT
        other_pipette = state.get_pipette_data_by_mount(other_mount)
        cache_request = {mount: request.pipetteName}
        if other_pipette is not None:
            cache_request[other_mount] = other_pipette.pipette_name

        # TODO(mc, 2020-10-18): calling `cache_instruments` mirrors the
        # behavior of protocol_context.load_instrument, and is used here as a
        # pipette existence check
        try:
            await self._hardware.cache_instruments(cache_request)
        except RuntimeError as e:
            raise FailedToLoadPipetteError(str(e)) from e

        pipette_id = self._id_generator.generate_id()
        return LoadPipetteResult(pipetteId=pipette_id)
