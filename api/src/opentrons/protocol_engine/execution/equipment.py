"""Equipment command side-effect logic."""
from dataclasses import dataclass
from typing import Optional, overload, Union, List

from opentrons.calibration_storage.helpers import uri_from_details
from opentrons.protocols.models import LabwareDefinition
from opentrons_shared_data.pipette.dev_types import PipetteNameType
from opentrons.config import feature_flags
from opentrons.types import MountType, Point
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.types import OT3Mount, OT3Axis
from opentrons.hardware_control.modules import (
    AbstractModule,
    MagDeck,
    HeaterShaker,
    TempDeck,
    Thermocycler,
)
from opentrons.protocol_engine.state.module_substates import (
    MagneticModuleId,
    HeaterShakerModuleId,
    TemperatureModuleId,
    ThermocyclerModuleId,
)
from ..errors import (
    FailedToLoadPipetteError,
    LabwareDefinitionDoesNotExistError,
    ModuleNotAttachedError,
    GripperNotAttachedError,
    UnsupportedLabwareMovement,
)
from ..resources import LabwareDataProvider, ModuleDataProvider, ModelUtils
from ..state import StateStore, HardwareModule
from ..types import (
    LabwareLocation,
    DeckSlotLocation,
    ModuleLocation,
    LabwareOffsetLocation,
    ModuleModel,
    ModuleDefinition,
    OFF_DECK_LOCATION,
)

# TODO: remove once hardware control is able to calibrate & handle the offsets
GRIPPER_OFFSET = Point(0.0, 1.0, 0.0)
GRIP_FORCE = 20  # Newtons


@dataclass(frozen=True)
class LoadedLabwareData:
    """The result of a load labware procedure."""

    labware_id: str
    definition: LabwareDefinition
    offsetId: Optional[str]


@dataclass(frozen=True)
class LoadedPipetteData:
    """The result of a load pipette procedure."""

    pipette_id: str


@dataclass(frozen=True)
class LoadedModuleData:
    """The result of a load module procedure."""

    module_id: str
    serial_number: str
    definition: ModuleDefinition


class EquipmentHandler:
    """Implementation logic for labware, pipette, and module loading."""

    _hardware_api: HardwareControlAPI
    _state_store: StateStore
    _labware_data_provider: LabwareDataProvider
    _module_data_provider: ModuleDataProvider
    _model_utils: ModelUtils

    def __init__(
        self,
        hardware_api: HardwareControlAPI,
        state_store: StateStore,
        labware_data_provider: Optional[LabwareDataProvider] = None,
        module_data_provider: Optional[ModuleDataProvider] = None,
        model_utils: Optional[ModelUtils] = None,
    ) -> None:
        """Initialize an EquipmentHandler instance."""
        self._hardware_api = hardware_api
        self._state_store = state_store
        self._labware_data_provider = labware_data_provider or LabwareDataProvider()
        self._module_data_provider = module_data_provider or ModuleDataProvider()
        self._model_utils = model_utils or ModelUtils()

    async def load_labware(
        self,
        load_name: str,
        namespace: str,
        version: int,
        location: LabwareLocation,
        labware_id: Optional[str],
    ) -> LoadedLabwareData:
        """Load labware by assigning an identifier and pulling required data.

        Args:
            load_name: The labware's load name.
            namespace: The labware's namespace.
            version: The labware's version.
            location: The deck location at which labware is placed.
            labware_id: An optional identifier to assign the labware. If None, an
                identifier will be generated.

        Raises:
            ModuleNotLoadedError: If `location` references a module ID
                that doesn't point to a valid loaded module.

        Returns:
            A LoadedLabwareData object.
        """
        labware_id = (
            labware_id if labware_id is not None else self._model_utils.generate_id()
        )

        definition_uri = uri_from_details(
            load_name=load_name,
            namespace=namespace,
            version=version,
        )

        try:
            # Try to use existing definition in state.
            definition = self._state_store.labware.get_definition_by_uri(definition_uri)
        except LabwareDefinitionDoesNotExistError:
            definition = await self._labware_data_provider.get_labware_definition(
                load_name=load_name,
                namespace=namespace,
                version=version,
            )

        # Allow propagation of ModuleNotLoadedError.
        offset_id = self.find_applicable_labware_offset_id(
            labware_definition_uri=definition_uri,
            labware_location=location,
        )

        return LoadedLabwareData(
            labware_id=labware_id, definition=definition, offsetId=offset_id
        )

    async def move_labware_with_gripper(
        self, labware_id: str, new_location: LabwareLocation
    ) -> None:
        """Move a loaded labware from one location to another."""
        if not feature_flags.enable_ot3_hardware_controller():
            raise UnsupportedLabwareMovement(
                "Labware movement w/ gripper is only available on the OT3"
            )
        from opentrons.hardware_control.ot3api import OT3API

        assert isinstance(
            self._hardware_api, OT3API
        ), "Gripper is only available on the OT3"

        if self._hardware_api.attached_gripper is None:
            raise GripperNotAttachedError(
                "No gripper found in order to perform labware movement with."
            )

        from_location = self._state_store.labware.get_location(labware_id=labware_id)
        assert isinstance(
            from_location, (DeckSlotLocation, ModuleLocation)
        ), "Off-deck labware movements are not supported using the gripper."
        assert isinstance(
            new_location, (DeckSlotLocation, ModuleLocation)
        ), "Off-deck labware movements are not supported using the gripper."

        gripper_mount = OT3Mount.GRIPPER

        # Retract all mounts
        await self._hardware_api.home(axes=[OT3Axis.Z_L, OT3Axis.Z_R, OT3Axis.Z_G])
        # TODO: reset well location cache upon completion of command execution
        await self._hardware_api.home_gripper_jaw()

        gripper_homed_position = await self._hardware_api.gantry_position(
            mount=gripper_mount
        )
        waypoints_to_labware = self._get_gripper_movement_waypoints(
            labware_id=labware_id,
            location=from_location,
            current_position=await self._hardware_api.gantry_position(
                mount=gripper_mount
            ),
            gripper_home_z=gripper_homed_position.z,
        )
        for waypoint in waypoints_to_labware:
            await self._hardware_api.move_to(mount=gripper_mount, abs_position=waypoint)

        await self._hardware_api.grip(force_newtons=GRIP_FORCE)

        waypoints_to_new_location = self._get_gripper_movement_waypoints(
            labware_id=labware_id,
            location=new_location,
            current_position=waypoints_to_labware[-1],
            gripper_home_z=gripper_homed_position.z,
        )
        for waypoint in waypoints_to_new_location:
            await self._hardware_api.move_to(mount=gripper_mount, abs_position=waypoint)

        await self._hardware_api.ungrip()
        await self._hardware_api.move_to(
            mount=OT3Mount.GRIPPER,
            abs_position=Point(
                waypoints_to_new_location[-1].x,
                waypoints_to_new_location[-1].y,
                gripper_homed_position.z,
            ),
        )

    def _get_gripper_movement_waypoints(
        self,
        labware_id: str,
        location: Union[DeckSlotLocation, ModuleLocation],
        current_position: Point,
        gripper_home_z: float,
    ) -> List[Point]:
        """Get waypoints for gripper to move to a specified location."""
        # TODO: remove this after support for module locations is added
        assert isinstance(
            location, DeckSlotLocation
        ), "Moving labware to & from modules with a gripper is not implemented yet."

        # Keeping grip height as half of overall height of labware
        grip_height = (
            self._state_store.labware.get_dimensions(labware_id=labware_id).z / 2
        )
        slot_loc = (
            self._state_store.labware.get_slot_center_position(location.slotName)
            + GRIPPER_OFFSET
        )
        waypoints: List[Point] = [
            Point(current_position.x, current_position.y, gripper_home_z),
            Point(slot_loc.x, slot_loc.y, gripper_home_z),
            Point(slot_loc.x, slot_loc.y, grip_height),
        ]
        return waypoints

    async def load_pipette(
        self,
        pipette_name: PipetteNameType,
        mount: MountType,
        pipette_id: Optional[str],
    ) -> LoadedPipetteData:
        """Ensure the requested pipette is attached.

        Args:
            pipette_name: The pipette name.
            mount: The mount on which pipette must be attached.
            pipette_id: An optional identifier to assign the pipette. If None, an
                identifier will be generated.

        Returns:
            A LoadedPipetteData object.
        """
        other_mount = mount.other_mount()
        other_pipette = self._state_store.pipettes.get_by_mount(other_mount)

        cache_request = {mount.to_hw_mount(): pipette_name.value}
        if other_pipette is not None:
            cache_request[other_mount.to_hw_mount()] = other_pipette.pipetteName.value

        # TODO(mc, 2020-10-18): calling `cache_instruments` mirrors the
        # behavior of protocol_context.load_instrument, and is used here as a
        # pipette existence check
        try:
            await self._hardware_api.cache_instruments(cache_request)
        except RuntimeError as e:
            raise FailedToLoadPipetteError(str(e)) from e

        pipette_id = pipette_id or self._model_utils.generate_id()

        return LoadedPipetteData(pipette_id=pipette_id)

    async def load_module(
        self,
        model: ModuleModel,
        location: DeckSlotLocation,
        module_id: Optional[str],
    ) -> LoadedModuleData:
        """Ensure the required module is attached.

        Args:
            model: The model name of the module.
            location: The deck location of the module
            module_id: Optional ID assigned to the module.
                       If None, an ID will be generated.

        Returns:
            A LoadedModuleData object.

        Raises:
            ModuleNotAttachedError: A not-yet-assigned module matching the requested
                parameters could not be found in the attached modules list.
            ModuleAlreadyPresentError: A module of a different type is already
                assigned to the requested location.
        """
        # TODO(mc, 2022-02-09): validate module location given deck definition
        use_virtual_modules = self._state_store.config.use_virtual_modules

        if not use_virtual_modules:
            attached_modules = [
                HardwareModule(
                    serial_number=hw_mod.device_info["serial"],
                    definition=self._module_data_provider.get_definition(
                        ModuleModel(hw_mod.model())
                    ),
                )
                for hw_mod in self._hardware_api.attached_modules
            ]

            attached_module = self._state_store.modules.select_hardware_module_to_load(
                model=model,
                location=location,
                attached_modules=attached_modules,
            )

        else:
            attached_module = HardwareModule(
                serial_number=self._model_utils.generate_id(
                    prefix="fake-serial-number-"
                ),
                definition=self._module_data_provider.get_definition(model),
            )

        return LoadedModuleData(
            module_id=self._model_utils.ensure_id(module_id),
            serial_number=attached_module.serial_number,
            definition=attached_module.definition,
        )

    @overload
    def get_module_hardware_api(
        self,
        module_id: MagneticModuleId,
    ) -> Optional[MagDeck]:
        ...

    @overload
    def get_module_hardware_api(
        self,
        module_id: HeaterShakerModuleId,
    ) -> Optional[HeaterShaker]:
        ...

    @overload
    def get_module_hardware_api(
        self,
        module_id: TemperatureModuleId,
    ) -> Optional[TempDeck]:
        ...

    @overload
    def get_module_hardware_api(
        self,
        module_id: ThermocyclerModuleId,
    ) -> Optional[Thermocycler]:
        ...

    def get_module_hardware_api(self, module_id: str) -> Optional[AbstractModule]:
        """Get the hardware API for a given module."""
        use_virtual_modules = self._state_store.config.use_virtual_modules
        if use_virtual_modules:
            return None

        attached_modules = self._hardware_api.attached_modules
        serial_number = self._state_store.modules.get_serial_number(module_id)
        for mod in attached_modules:
            if mod.device_info["serial"] == serial_number:
                return mod

        raise ModuleNotAttachedError(
            f'No module attached with serial number "{serial_number}"'
            f' for module ID "{module_id}".'
        )

    def find_applicable_labware_offset_id(
        self, labware_definition_uri: str, labware_location: LabwareLocation
    ) -> Optional[str]:
        """Figure out what offset would apply to a labware in the given location.

        Raises:
            ModuleNotLoadedError: If `labware_location` references a module ID
                that doesn't point to a valid loaded module.

        Returns:
            The ID of the labware offset that will apply,
            or None if no labware offset will apply.
        """
        if isinstance(labware_location, DeckSlotLocation):
            slot_name = labware_location.slotName
            module_model = None
        elif isinstance(labware_location, ModuleLocation):
            module_id = labware_location.moduleId
            # Allow ModuleNotLoadedError to propagate.
            module_model = self._state_store.modules.get_model(module_id=module_id)
            module_location = self._state_store.modules.get_location(
                module_id=module_id
            )
            slot_name = module_location.slotName
        else:
            # No offset for off-deck location.
            # Returning None instead of raising an exception
            # allows loading a labware with 'off-deck' as valid location.
            return None

        offset = self._state_store.labware.find_applicable_labware_offset(
            definition_uri=labware_definition_uri,
            location=LabwareOffsetLocation(
                slotName=slot_name,
                moduleModel=module_model,
            ),
        )

        return None if offset is None else offset.id
