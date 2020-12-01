"""Equipment command side-effect logic."""
from dataclasses import dataclass
from typing import Tuple

from opentrons_shared_data.labware.dev_types import LabwareDefinition
from opentrons_shared_data.pipette.dev_types import PipetteName
from opentrons.types import MountType
from opentrons.hardware_control.api import API as HardwareAPI

from ..errors import FailedToLoadPipetteError
from ..resources import ResourceProviders
from ..state import StateView
from ..types import LabwareLocation


@dataclass(frozen=True)
class LoadedLabware:
    """The result of a load labware procedure."""

    labware_id: str
    definition: LabwareDefinition
    calibration: Tuple[float, float, float]


@dataclass(frozen=True)
class LoadedPipette:
    """The result of a load pipette procedure."""

    pipette_id: str


class EquipmentHandler:
    """Implementation logic for labware, pipette, and module loading."""

    _hardware: HardwareAPI
    _state: StateView
    _resources: ResourceProviders

    def __init__(
        self,
        hardware: HardwareAPI,
        state: StateView,
        resources: ResourceProviders,
    ) -> None:
        """Initialize an EquipmentHandler instance."""
        self._hardware = hardware
        self._state = state
        self._resources = resources

    async def load_labware(
        self,
        load_name: str,
        namespace: str,
        version: int,
        location: LabwareLocation,
    ) -> LoadedLabware:
        """Load labware by assigning an identifier and pulling required data."""
        labware_id = self._resources.id_generator.generate_id()

        definition = await self._resources.labware_data.get_labware_definition(
            load_name=load_name,
            namespace=namespace,
            version=version,
        )

        calibration = await self._resources.labware_data.get_labware_calibration(
            definition=definition,
            location=location,
        )

        return LoadedLabware(
            labware_id=labware_id,
            definition=definition,
            calibration=calibration,
        )

    async def load_pipette(
        self,
        pipette_name: PipetteName,
        mount: MountType,
    ) -> LoadedPipette:
        """Ensure the requested pipette is attached."""
        other_mount = mount.other_mount()
        other_pipette = self._state.pipettes.get_pipette_data_by_mount(
            other_mount,
        )

        cache_request = {mount.to_hw_mount(): pipette_name}
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

        pipette_id = self._resources.id_generator.generate_id()

        return LoadedPipette(pipette_id=pipette_id)
