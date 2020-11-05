"""Equipment command side-effect logic."""
from opentrons.hardware_control.api import API as HardwareAPI

from ..errors import FailedToLoadPipetteError
from ..resources import IdGenerator, LabwareData
from ..state import StateView

from ..command_models import (
    LoadLabwareRequest,
    LoadLabwareResult,
    LoadPipetteRequest,
    LoadPipetteResult
)


class EquipmentHandler():
    """Implementation logic for labware, pipette, and module loading."""

    def __init__(
        self,
        hardware: HardwareAPI,
        state: StateView,
        id_generator: IdGenerator,
        labware_data: LabwareData
    ) -> None:
        """Initialize an EquipmentHandler instance."""
        self._hardware: HardwareAPI = hardware
        self._state: StateView = state
        self._id_generator: IdGenerator = id_generator
        self._labware_data: LabwareData = labware_data

    async def handle_load_labware(
        self,
        request: LoadLabwareRequest
    ) -> LoadLabwareResult:
        """Load labware definition and calibration data."""
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
    ) -> LoadPipetteResult:
        """Ensure the requested pipette is attached."""
        mount = request.mount
        other_mount = request.mount.other_mount()
        other_pipette = self._state.pipettes.get_pipette_data_by_mount(
            other_mount
        )

        cache_request = {mount.to_hw_mount(): request.pipetteName}
        if other_pipette is not None:
            cache_request[
                other_mount.to_hw_mount()
            ] = other_pipette.pipette_name

        # TODO(mc, 2020-10-18): calling `cache_instruments` mirrors the
        # behavior of protocol_context.load_instrument, and is used here as a
        # pipette existence check
        try:
            await self._hardware.cache_instruments(cache_request)
        except RuntimeError as e:
            raise FailedToLoadPipetteError(str(e)) from e

        pipette_id = self._id_generator.generate_id()
        return LoadPipetteResult(pipetteId=pipette_id)
