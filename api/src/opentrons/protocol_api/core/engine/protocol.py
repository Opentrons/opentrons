"""ProtocolEngine-based Protocol API core implementation."""
from typing import Dict, Optional, Type, Union, List, Tuple

from opentrons.protocol_api import _waste_chute_dimensions

from opentrons.protocol_engine.commands import LoadModuleResult
from opentrons_shared_data.deck.dev_types import DeckDefinitionV4, SlotDefV3
from opentrons_shared_data.labware.labware_definition import LabwareDefinition
from opentrons_shared_data.labware.dev_types import LabwareDefinition as LabwareDefDict
from opentrons_shared_data.pipette.dev_types import PipetteNameType
from opentrons_shared_data.robot.dev_types import RobotType

from opentrons.types import DeckSlotName, Location, Mount, MountType, Point
from opentrons.hardware_control import SyncHardwareAPI, SynchronousAdapter
from opentrons.hardware_control.modules import AbstractModule
from opentrons.hardware_control.modules.types import ModuleModel, ModuleType
from opentrons.hardware_control.types import DoorState
from opentrons.protocols.api_support.util import AxisMaxSpeeds
from opentrons.protocols.api_support.types import APIVersion

from opentrons.protocol_engine import (
    DeckSlotLocation,
    AddressableAreaLocation,
    ModuleLocation,
    OnLabwareLocation,
    ModuleModel as EngineModuleModel,
    LabwareMovementStrategy,
    LabwareOffsetVector,
    LoadedLabware,
    LoadedModule,
)
from opentrons.protocol_engine.types import (
    ModuleModel as ProtocolEngineModuleModel,
    OFF_DECK_LOCATION,
    LabwareLocation,
    NonStackedLocation,
)
from opentrons.protocol_engine.clients import SyncClient as ProtocolEngineClient
from opentrons.protocol_engine.errors import (
    LabwareNotLoadedOnModuleError,
    LabwareNotLoadedOnLabwareError,
)

from ... import validation
from ..._types import OffDeckType, OFF_DECK, StagingSlotName
from ..._liquid import Liquid
from ..._waste_chute import WasteChute
from ..protocol import AbstractProtocol
from ..labware import LabwareLoadParams
from .labware import LabwareCore
from .instrument import InstrumentCore
from .module_core import (
    ModuleCore,
    TemperatureModuleCore,
    MagneticModuleCore,
    ThermocyclerModuleCore,
    HeaterShakerModuleCore,
    NonConnectedModuleCore,
    MagneticBlockCore,
)
from .exceptions import InvalidModuleLocationError
from . import load_labware_params
from . import deck_conflict


class ProtocolCore(
    AbstractProtocol[
        InstrumentCore, LabwareCore, Union[ModuleCore, NonConnectedModuleCore]
    ]
):
    """Protocol API core using a ProtocolEngine.

    Args:
        engine_client: A client to the ProtocolEngine that is executing the protocol.
        api_version: The Python Protocol API versionat which  this core is operating.
        sync_hardware: A SynchronousAdapter-wrapped Hardware Control API.
    """

    def __init__(
        self,
        engine_client: ProtocolEngineClient,
        api_version: APIVersion,
        sync_hardware: SyncHardwareAPI,
    ) -> None:
        self._engine_client = engine_client
        self._api_version = api_version
        self._sync_hardware = sync_hardware
        self._last_location: Optional[Location] = None
        self._last_mount: Optional[Mount] = None
        self._labware_cores_by_id: Dict[str, LabwareCore] = {}
        self._module_cores_by_id: Dict[
            str, Union[ModuleCore, NonConnectedModuleCore]
        ] = {}
        self._load_fixed_trash()

    @property
    def api_version(self) -> APIVersion:
        """Get the api version protocol target."""
        return self._api_version

    @property
    def robot_type(self) -> RobotType:
        return self._engine_client.state.config.robot_type

    @property
    def fixed_trash(self) -> Optional[LabwareCore]:
        """Get the fixed trash labware."""
        trash_id = self._engine_client.state.labware.get_fixed_trash_id()
        if trash_id is not None:
            return self._labware_cores_by_id[trash_id]
        return None

    def _load_fixed_trash(self) -> None:
        trash_id = self._engine_client.state.labware.get_fixed_trash_id()
        if trash_id is not None:
            self._labware_cores_by_id[trash_id] = LabwareCore(
                labware_id=trash_id,
                engine_client=self._engine_client,
            )

    def get_max_speeds(self) -> AxisMaxSpeeds:
        """Get a control interface for maximum move speeds."""
        raise NotImplementedError("ProtocolCore.get_max_speeds not implemented")

    def get_hardware(self) -> SyncHardwareAPI:
        """Get direct access to a hardware control interface."""
        return self._sync_hardware

    def is_simulating(self) -> bool:
        """Get whether the protocol is being analyzed or actually run."""
        return self._engine_client.state.config.ignore_pause

    def add_labware_definition(
        self,
        definition: LabwareDefDict,
    ) -> LabwareLoadParams:
        """Add a labware definition to the set of loadable definitions."""
        uri = self._engine_client.add_labware_definition(
            LabwareDefinition.parse_obj(definition)
        )
        return LabwareLoadParams.from_uri(uri)

    def load_labware(
        self,
        load_name: str,
        location: Union[
            DeckSlotName,
            StagingSlotName,
            LabwareCore,
            ModuleCore,
            NonConnectedModuleCore,
            OffDeckType,
        ],
        label: Optional[str],
        namespace: Optional[str],
        version: Optional[int],
    ) -> LabwareCore:
        """Load a labware using its identifying parameters."""
        load_location = self._convert_labware_location(location=location)

        custom_labware_params = (
            self._engine_client.state.labware.find_custom_labware_load_params()
        )
        namespace, version = load_labware_params.resolve(
            load_name, namespace, version, custom_labware_params
        )

        load_result = self._engine_client.load_labware(
            load_name=load_name,
            location=load_location,
            namespace=namespace,
            version=version,
            display_name=label,
        )
        # FIXME(jbl, 2023-08-14) validating after loading the object issue
        validation.ensure_definition_is_labware(load_result.definition)

        # FIXME(mm, 2023-02-21):
        #
        # We're wrongly checking for deck conflicts *after* we've already loaded the
        # labware into the ProtocolEngine. If it turns out there is a conflict,
        # and this check raises, it will leave this object and its ProtocolEngine
        # in a confusing inconsistent state.
        #
        # I expect we can get away with this in practice a lot of the time because
        # exceptions in Python protocols are mostly treated as fatal, anyway.
        # Users rarely catch them.
        deck_conflict.check(
            engine_state=self._engine_client.state,
            new_labware_id=load_result.labwareId,
            # It's important that we don't fetch these IDs from Protocol Engine, and
            # use our own bookkeeping instead. If we fetched these IDs from Protocol
            # Engine, it would have leaked state from Labware Position Check in the
            # same HTTP run.
            #
            # Wrapping .keys() in list() is just to make Decoy verification easier.
            existing_labware_ids=list(self._labware_cores_by_id.keys()),
            existing_module_ids=list(self._module_cores_by_id.keys()),
        )

        labware_core = LabwareCore(
            labware_id=load_result.labwareId,
            engine_client=self._engine_client,
        )

        self._labware_cores_by_id[labware_core.labware_id] = labware_core

        return labware_core

    def load_adapter(
        self,
        load_name: str,
        location: Union[
            DeckSlotName,
            StagingSlotName,
            ModuleCore,
            NonConnectedModuleCore,
            OffDeckType,
        ],
        namespace: Optional[str],
        version: Optional[int],
    ) -> LabwareCore:
        """Load an adapter using its identifying parameters"""
        load_location = self._get_non_stacked_location(location=location)

        custom_labware_params = (
            self._engine_client.state.labware.find_custom_labware_load_params()
        )
        namespace, version = load_labware_params.resolve(
            load_name, namespace, version, custom_labware_params
        )
        load_result = self._engine_client.load_labware(
            load_name=load_name,
            location=load_location,
            namespace=namespace,
            version=version,
        )
        # FIXME(jbl, 2023-08-14) validating after loading the object issue
        validation.ensure_definition_is_adapter(load_result.definition)

        # FIXME(jbl, 2023-06-23) read fixme above:
        deck_conflict.check(
            engine_state=self._engine_client.state,
            new_labware_id=load_result.labwareId,
            # It's important that we don't fetch these IDs from Protocol Engine, and
            # use our own bookkeeping instead. If we fetched these IDs from Protocol
            # Engine, it would have leaked state from Labware Position Check in the
            # same HTTP run.
            #
            # Wrapping .keys() in list() is just to make Decoy verification easier.
            existing_labware_ids=list(self._labware_cores_by_id.keys()),
            existing_module_ids=list(self._module_cores_by_id.keys()),
        )

        labware_core = LabwareCore(
            labware_id=load_result.labwareId,
            engine_client=self._engine_client,
        )

        self._labware_cores_by_id[labware_core.labware_id] = labware_core

        return labware_core

    # TODO (spp, 2022-12-14): https://opentrons.atlassian.net/browse/RLAB-237
    def move_labware(
        self,
        labware_core: LabwareCore,
        new_location: Union[
            DeckSlotName,
            StagingSlotName,
            LabwareCore,
            ModuleCore,
            NonConnectedModuleCore,
            OffDeckType,
            WasteChute,
        ],
        use_gripper: bool,
        pause_for_manual_move: bool,
        pick_up_offset: Optional[Tuple[float, float, float]],
        drop_offset: Optional[Tuple[float, float, float]],
    ) -> None:
        """Move the given labware to a new location."""
        if use_gripper:
            strategy = LabwareMovementStrategy.USING_GRIPPER
        elif pause_for_manual_move:
            strategy = LabwareMovementStrategy.MANUAL_MOVE_WITH_PAUSE
        else:
            strategy = LabwareMovementStrategy.MANUAL_MOVE_WITHOUT_PAUSE

        _pick_up_offset = (
            LabwareOffsetVector(
                x=pick_up_offset[0], y=pick_up_offset[1], z=pick_up_offset[2]
            )
            if pick_up_offset
            else None
        )
        _drop_offset = (
            LabwareOffsetVector(x=drop_offset[0], y=drop_offset[1], z=drop_offset[2])
            if drop_offset
            else None
        )

        if isinstance(new_location, WasteChute):
            self._move_labware_to_waste_chute(
                labware_core, strategy, _pick_up_offset, _drop_offset
            )
        else:
            to_location = self._convert_labware_location(location=new_location)

            # TODO(mm, 2023-02-23): Check for conflicts with other items on the deck,
            # when move_labware() support is no longer experimental.

            self._engine_client.move_labware(
                labware_id=labware_core.labware_id,
                new_location=to_location,
                strategy=strategy,
                pick_up_offset=_pick_up_offset,
                drop_offset=_drop_offset,
            )

        if strategy == LabwareMovementStrategy.USING_GRIPPER:
            # Clear out last location since it is not relevant to pipetting
            # and we only use last location for in-place pipetting commands
            self.set_last_location(location=None, mount=Mount.EXTENSION)

    def _move_labware_to_waste_chute(
        self,
        labware_core: LabwareCore,
        strategy: LabwareMovementStrategy,
        pick_up_offset: Optional[LabwareOffsetVector],
        drop_offset: Optional[LabwareOffsetVector],
    ) -> None:
        slot = DeckSlotLocation(slotName=DeckSlotName.SLOT_D3)
        slot_width = 128
        slot_height = 86
        drop_offset_from_slot = (
            _waste_chute_dimensions.SLOT_ORIGIN_TO_GRIPPER_JAW_CENTER
            - Point(x=slot_width / 2, y=slot_height / 2)
        )
        if drop_offset is not None:
            drop_offset_from_slot += Point(
                x=drop_offset.x, y=drop_offset.y, z=drop_offset.z
            )

        # To get the physical movement to happen, move the labware "into the slot" with a giant
        # offset to dunk it in the waste chute.
        self._engine_client.move_labware(
            labware_id=labware_core.labware_id,
            new_location=slot,
            strategy=strategy,
            pick_up_offset=pick_up_offset,
            drop_offset=LabwareOffsetVector(
                x=drop_offset_from_slot.x,
                y=drop_offset_from_slot.y,
                z=drop_offset_from_slot.z,
            ),
        )

        # To get the logical movement to be correct, move the labware off-deck.
        # Otherwise, leaving the labware "in the slot" would mean you couldn't call this function
        # again for other labware.
        self._engine_client.move_labware(
            labware_id=labware_core.labware_id,
            new_location=self._convert_labware_location(OFF_DECK),
            strategy=LabwareMovementStrategy.MANUAL_MOVE_WITHOUT_PAUSE,
            pick_up_offset=None,
            drop_offset=None,
        )

    def _resolve_module_hardware(
        self, serial_number: str, model: ModuleModel
    ) -> AbstractModule:
        """Resolve a module serial number to module hardware API."""
        if self.is_simulating():
            return self._sync_hardware.create_simulating_module(model)  # type: ignore[no-any-return]

        for module_hardware in self._sync_hardware.attached_modules:
            if serial_number == module_hardware.device_info["serial"]:
                return module_hardware  # type: ignore[no-any-return]

        raise RuntimeError(f"Could not find specified module: {model.value}")

    def load_module(
        self,
        model: ModuleModel,
        deck_slot: Optional[DeckSlotName],
        configuration: Optional[str],
    ) -> Union[ModuleCore, NonConnectedModuleCore]:
        """Load a module into the protocol."""
        assert configuration is None, "Module `configuration` is deprecated"

        module_type = ModuleType.from_model(model)
        # TODO(mc, 2022-10-20): move to public ProtocolContext
        # once `Deck` and `ProtocolEngine` play nicely together
        if deck_slot is None:
            module_type = ModuleType.from_model(model)
            if module_type == ModuleType.THERMOCYCLER:
                deck_slot = DeckSlotName.SLOT_7
            else:
                raise InvalidModuleLocationError(deck_slot, model.name)

        robot_type = self._engine_client.state.config.robot_type
        normalized_deck_slot = deck_slot.to_equivalent_for_robot_type(robot_type)
        self._ensure_module_location(normalized_deck_slot, module_type)

        result = self._engine_client.load_module(
            model=EngineModuleModel(model),
            location=DeckSlotLocation(slotName=normalized_deck_slot),
        )

        module_core = self._get_module_core(load_module_result=result, model=model)

        # FIXME(mm, 2023-02-21):
        # We're wrongly doing this conflict check *after* we've already loaded the
        # module into the ProtocolEngine. See FIXME comment in self.load_labware().
        deck_conflict.check(
            engine_state=self._engine_client.state,
            new_module_id=result.moduleId,
            # It's important that we don't fetch these IDs from Protocol Engine.
            # See comment in self.load_labware().
            #
            # Wrapping .keys() in list() is just to make Decoy verification easier.
            existing_labware_ids=list(self._labware_cores_by_id.keys()),
            existing_module_ids=list(self._module_cores_by_id.keys()),
        )

        self._module_cores_by_id[module_core.module_id] = module_core

        return module_core

    def _create_non_connected_module_core(
        self, load_module_result: LoadModuleResult
    ) -> NonConnectedModuleCore:
        return MagneticBlockCore(
            module_id=load_module_result.moduleId,
            engine_client=self._engine_client,
            api_version=self.api_version,
        )

    def _create_module_core(
        self, load_module_result: LoadModuleResult, model: ModuleModel
    ) -> ModuleCore:
        module_core_cls: Type[ModuleCore] = ModuleCore

        type_lookup: Dict[ModuleType, Type[ModuleCore]] = {
            ModuleType.TEMPERATURE: TemperatureModuleCore,
            ModuleType.MAGNETIC: MagneticModuleCore,
            ModuleType.THERMOCYCLER: ThermocyclerModuleCore,
            ModuleType.HEATER_SHAKER: HeaterShakerModuleCore,
        }

        module_type = load_module_result.model.as_type()

        module_core_cls = type_lookup[module_type]

        assert (
            load_module_result.serialNumber is not None
        ), "Expected a connected module but did not get a serial number."
        selected_hardware = self._resolve_module_hardware(
            load_module_result.serialNumber, model
        )

        return module_core_cls(
            module_id=load_module_result.moduleId,
            engine_client=self._engine_client,
            api_version=self.api_version,
            sync_module_hardware=SynchronousAdapter(selected_hardware),
        )

    def _get_module_core(
        self, load_module_result: LoadModuleResult, model: ModuleModel
    ) -> Union[ModuleCore, NonConnectedModuleCore]:
        if ProtocolEngineModuleModel.is_magnetic_block(load_module_result.model):
            return self._create_non_connected_module_core(load_module_result)
        else:
            return self._create_module_core(
                load_module_result=load_module_result, model=model
            )

    def load_instrument(
        self, instrument_name: PipetteNameType, mount: Mount
    ) -> InstrumentCore:
        """Load an instrument into the protocol.

        Args:
            instrument_name: Load name of the instrument.
            mount: Mount the instrument is attached to.

        Returns:
            An instrument core configured to use the requested instrument.
        """
        engine_mount = MountType[mount.name]
        load_result = self._engine_client.load_pipette(instrument_name, engine_mount)

        return InstrumentCore(
            pipette_id=load_result.pipetteId,
            engine_client=self._engine_client,
            sync_hardware_api=self._sync_hardware,
            protocol_core=self,
            # TODO(mm, 2022-11-10): Deduplicate "400" with legacy core.
            default_movement_speed=400,
        )

    def pause(self, msg: Optional[str]) -> None:
        """Pause the protocol."""
        self._engine_client.wait_for_resume(message=msg)

    def comment(self, msg: str) -> None:
        """Create a comment in the protocol to be shown in the log."""
        self._engine_client.comment(message=msg)

    def delay(self, seconds: float, msg: Optional[str]) -> None:
        """Wait for a period of time before proceeding."""
        self._engine_client.wait_for_duration(seconds=seconds, message=msg)

    def home(self) -> None:
        """Move all axes to their home positions."""
        self._engine_client.home(axes=None)

    def set_rail_lights(self, on: bool) -> None:
        """Set the device's rail lights."""
        self._engine_client.set_rail_lights(on=on)

    def get_rail_lights_on(self) -> bool:
        """Get whether the device's rail lights are on."""
        return self._sync_hardware.get_lights()["rails"]  # type: ignore[no-any-return]

    def door_closed(self) -> bool:
        """Get whether the device's front door is closed."""
        return self._sync_hardware.door_state == DoorState.CLOSED  # type: ignore[no-any-return]

    def get_last_location(
        self,
        mount: Optional[Mount] = None,
    ) -> Optional[Location]:
        """Get the last accessed location."""
        if mount is None or mount == self._last_mount:
            return self._last_location

        return None

    def set_last_location(
        self,
        location: Optional[Location],
        mount: Optional[Mount] = None,
    ) -> None:
        """Set the last accessed location."""
        self._last_location = location
        self._last_mount = mount

    def get_deck_definition(self) -> DeckDefinitionV4:
        """Get the geometry definition of the robot's deck."""
        return self._engine_client.state.labware.get_deck_definition()

    def get_slot_definition(self, slot: DeckSlotName) -> SlotDefV3:
        """Get the slot definition from the robot's deck."""
        return self._engine_client.state.addressable_areas.get_slot_definition(slot)

    def _ensure_module_location(
        self, slot: DeckSlotName, module_type: ModuleType
    ) -> None:
        slot_def = self.get_slot_definition(slot)
        compatible_modules = slot_def["compatibleModuleTypes"]
        if module_type.value not in compatible_modules:
            raise ValueError(f"A {module_type.value} cannot be loaded into slot {slot}")

    def get_slot_item(
        self, slot_name: DeckSlotName
    ) -> Union[LabwareCore, ModuleCore, NonConnectedModuleCore, None]:
        """Get the contents of a given slot, if any."""
        loaded_item = self._engine_client.state.geometry.get_slot_item(
            slot_name=slot_name,
            allowed_labware_ids=set(self._labware_cores_by_id.keys()),
            allowed_module_ids=set(self._module_cores_by_id.keys()),
        )

        if isinstance(loaded_item, LoadedLabware):
            return self._labware_cores_by_id[loaded_item.id]

        if isinstance(loaded_item, LoadedModule):
            return self._module_cores_by_id[loaded_item.id]

        return None

    def get_labware_on_module(
        self, module_core: Union[ModuleCore, NonConnectedModuleCore]
    ) -> Optional[LabwareCore]:
        """Get the item on top of a given module, if any."""
        try:
            labware_id = self._engine_client.state.labware.get_id_by_module(
                module_core.module_id
            )
            return self._labware_cores_by_id[labware_id]
        except LabwareNotLoadedOnModuleError:
            return None

    def get_labware_on_labware(
        self, labware_core: LabwareCore
    ) -> Optional[LabwareCore]:
        """Get the item on top of a given labware, if any."""
        try:
            labware_id = self._engine_client.state.labware.get_id_by_labware(
                labware_core.labware_id
            )
            return self._labware_cores_by_id[labware_id]
        except LabwareNotLoadedOnLabwareError:
            return None

    def get_slot_center(self, slot_name: DeckSlotName) -> Point:
        """Get the absolute coordinate of a slot's center."""
        return self._engine_client.state.addressable_areas.get_addressable_area_center(
            slot_name.id
        )

    def get_highest_z(self) -> float:
        """Get the highest Z point of all deck items."""
        return self._engine_client.state.geometry.get_all_labware_highest_z()

    def get_labware_cores(self) -> List[LabwareCore]:
        """Get all loaded labware cores."""
        return list(self._labware_cores_by_id.values())

    def get_module_cores(self) -> List[Union[ModuleCore, NonConnectedModuleCore]]:
        """Get all loaded module cores."""
        return list(self._module_cores_by_id.values())

    def define_liquid(
        self,
        name: str,
        description: Optional[str],
        display_color: Optional[str],
    ) -> Liquid:
        """Define a liquid to load into a well."""
        liquid = self._engine_client.add_liquid(
            name=name, description=description, color=display_color
        )

        return Liquid(
            _id=liquid.id,
            name=liquid.displayName,
            description=liquid.description,
            display_color=(
                liquid.displayColor.__root__ if liquid.displayColor else None
            ),
        )

    def get_labware_location(
        self, labware_core: LabwareCore
    ) -> Union[str, LabwareCore, ModuleCore, NonConnectedModuleCore, OffDeckType]:
        """Get labware parent location."""
        labware_location = self._engine_client.state.labware.get_location(
            labware_core.labware_id
        )
        if isinstance(labware_location, DeckSlotLocation):
            return validation.internal_slot_to_public_string(
                labware_location.slotName, self._engine_client.state.config.robot_type
            )
        elif isinstance(labware_location, ModuleLocation):
            return self._module_cores_by_id[labware_location.moduleId]
        elif isinstance(labware_location, OnLabwareLocation):
            return self._labware_cores_by_id[labware_location.labwareId]

        return OffDeckType.OFF_DECK

    def _convert_labware_location(
        self,
        location: Union[
            DeckSlotName,
            StagingSlotName,
            LabwareCore,
            ModuleCore,
            NonConnectedModuleCore,
            OffDeckType,
        ],
    ) -> LabwareLocation:
        if isinstance(location, LabwareCore):
            return OnLabwareLocation(labwareId=location.labware_id)
        else:
            return self._get_non_stacked_location(location)

    @staticmethod
    def _get_non_stacked_location(
        location: Union[
            DeckSlotName,
            StagingSlotName,
            ModuleCore,
            NonConnectedModuleCore,
            OffDeckType,
        ]
    ) -> NonStackedLocation:
        if isinstance(location, (ModuleCore, NonConnectedModuleCore)):
            return ModuleLocation(moduleId=location.module_id)
        elif location is OffDeckType.OFF_DECK:
            return OFF_DECK_LOCATION
        elif isinstance(location, DeckSlotName):
            return DeckSlotLocation(slotName=location)
        elif isinstance(location, StagingSlotName):
            return AddressableAreaLocation(addressableAreaName=location.id)
