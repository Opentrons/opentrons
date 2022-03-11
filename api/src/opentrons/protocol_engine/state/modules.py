"""Basic modules data state and store."""
from dataclasses import dataclass
from typing import Dict, List, NamedTuple, Optional, Sequence, Type, TypeVar, overload
from numpy import array, dot

from opentrons.hardware_control.modules import AbstractModule
from opentrons.hardware_control.modules.magdeck import (
    engage_height_is_in_range,
    OFFSET_TO_LABWARE_BOTTOM as MAGNETIC_MODULE_OFFSET_TO_LABWARE_BOTTOM,
    MAX_ENGAGE_HEIGHT as MAGNETIC_MODULE_MAX_ENGAGE_HEIGHT,
)
from opentrons.types import DeckSlotName

from ..types import (
    LoadedModule,
    ModuleModel,
    ModuleType,
    ModuleDefinition,
    DeckSlotLocation,
    ModuleDimensions,
    LabwareOffsetVector,
)
from .. import errors
from ..commands import Command, LoadModuleResult
from ..actions import Action, UpdateCommandAction
from .abstract_store import HasState, HandlesActions


class SlotTransit(NamedTuple):
    """Class defining starting and ending slots in a pipette movement."""

    start: DeckSlotName
    end: DeckSlotName


_THERMOCYCLER_SLOT_TRANSITS_TO_DODGE = [
    SlotTransit(start=DeckSlotName.SLOT_1, end=DeckSlotName.FIXED_TRASH),
    SlotTransit(start=DeckSlotName.FIXED_TRASH, end=DeckSlotName.SLOT_1),
    SlotTransit(start=DeckSlotName.SLOT_4, end=DeckSlotName.FIXED_TRASH),
    SlotTransit(start=DeckSlotName.FIXED_TRASH, end=DeckSlotName.SLOT_4),
    SlotTransit(start=DeckSlotName.SLOT_4, end=DeckSlotName.SLOT_9),
    SlotTransit(start=DeckSlotName.SLOT_9, end=DeckSlotName.SLOT_4),
    SlotTransit(start=DeckSlotName.SLOT_4, end=DeckSlotName.SLOT_8),
    SlotTransit(start=DeckSlotName.SLOT_8, end=DeckSlotName.SLOT_4),
    SlotTransit(start=DeckSlotName.SLOT_1, end=DeckSlotName.SLOT_8),
    SlotTransit(start=DeckSlotName.SLOT_8, end=DeckSlotName.SLOT_1),
    SlotTransit(start=DeckSlotName.SLOT_4, end=DeckSlotName.SLOT_11),
    SlotTransit(start=DeckSlotName.SLOT_11, end=DeckSlotName.SLOT_4),
    SlotTransit(start=DeckSlotName.SLOT_1, end=DeckSlotName.SLOT_11),
    SlotTransit(start=DeckSlotName.SLOT_11, end=DeckSlotName.SLOT_1),
]


@dataclass(frozen=True)
class HardwareModule:
    """Data describing an actually connected module."""

    serial_number: str
    definition: ModuleDefinition


@dataclass
class ModuleState:
    """Basic module data state and getter methods."""

    slot_by_module_id: Dict[str, DeckSlotName]
    hardware_module_by_slot: Dict[DeckSlotName, HardwareModule]


class ModuleStore(HasState[ModuleState], HandlesActions):
    """Module state container."""

    _state: ModuleState

    def __init__(self) -> None:
        """Initialize a ModuleStore and its state."""
        self._state = ModuleState(slot_by_module_id={}, hardware_module_by_slot={})

    def handle_action(self, action: Action) -> None:
        """Modify state in reaction to an action."""
        if isinstance(action, UpdateCommandAction):
            self._handle_command(action.command)

    def _handle_command(self, command: Command) -> None:
        if isinstance(command.result, LoadModuleResult):
            module_id = command.result.moduleId
            serial_number = command.result.serialNumber
            definition = command.result.definition
            slot_name = command.params.location.slotName

            self._state.slot_by_module_id[module_id] = slot_name
            self._state.hardware_module_by_slot[slot_name] = HardwareModule(
                serial_number=serial_number,
                definition=definition,
            )


class ModuleView(HasState[ModuleState]):
    """Read-only view of computet modules state."""

    _state: ModuleState

    def __init__(self, state: ModuleState) -> None:
        """Initialize the view with its backing state value."""
        self._state = state

    def get(self, module_id: str) -> LoadedModule:
        """Get module data by the module's unique identifier."""
        try:
            slot_name = self._state.slot_by_module_id[module_id]
            attached_module = self._state.hardware_module_by_slot[slot_name]

        except KeyError as e:
            raise errors.ModuleDoesNotExistError(
                f"Module {module_id} not found."
            ) from e

        return LoadedModule.construct(
            id=module_id,
            model=attached_module.definition.model,
            serialNumber=attached_module.serial_number,
            location=DeckSlotLocation(slotName=slot_name),
            definition=attached_module.definition,
        )

    def get_all(self) -> List[LoadedModule]:
        """Get a list of all module entries in state."""
        return [self.get(mod_id) for mod_id in self._state.slot_by_module_id.keys()]

    def get_location(self, module_id: str) -> DeckSlotLocation:
        """Get the slot location of the given module."""
        return self.get(module_id).location

    def get_model(self, module_id: str) -> ModuleModel:
        """Get the model name of the given module."""
        return self.get(module_id).model

    def get_serial_number(self, module_id: str) -> str:
        """Get the hardware serial number of the given module.

        If the underlying hardware API is simulating, this will be a dummy value
        provided by the hardware API.
        """
        return self.get(module_id).serialNumber

    def get_definition(self, module_id: str) -> ModuleDefinition:
        """Module definition by ID."""
        return self.get(module_id).definition

    def get_dimensions(self, module_id: str) -> ModuleDimensions:
        """Get the specified module's dimensions."""
        return self.get(module_id).definition.dimensions

    # TODO(mc, 2022-01-19): this method is missing unit test coverage
    def get_module_offset(self, module_id: str) -> LabwareOffsetVector:
        """Get the module's offset vector computed with slot transform."""
        definition = self.get_definition(module_id)
        slot = self.get_location(module_id).slotName.value
        pre_transform = array(
            (definition.labwareOffset.x, definition.labwareOffset.y, 1)
        )
        xforms_ser = definition.slotTransforms.get("ot2_standard", {}).get(
            slot, {"labwareOffset": [[1, 0, 0], [0, 1, 0], [0, 0, 1]]}
        )
        xforms_ser = xforms_ser["labwareOffset"]

        # Apply the slot transform, if any
        xform = array(xforms_ser)
        xformed = dot(xform, pre_transform)  # type: ignore[no-untyped-call]
        return LabwareOffsetVector(
            x=xformed[0],
            y=xformed[1],
            z=definition.labwareOffset.z,
        )

    # TODO(mc, 2022-01-19): this method is missing unit test coverage and
    # is also unused. Remove or add tests.
    def get_overall_height(self, module_id: str) -> float:
        """Get the height of the module."""
        return self.get_dimensions(module_id).bareOverallHeight

    # TODO(mc, 2022-01-19): this method is missing unit test coverage
    def get_height_over_labware(self, module_id: str) -> float:
        """Get the height of module parts above module labware base."""
        return self.get_dimensions(module_id).overLabwareHeight

    # TODO(mc, 2022-01-19): this method is missing unit test coverage and
    # is also unused. Remove or add tests.
    def get_lid_height(self, module_id: str) -> float:
        """Get lid height if module is thermocycler."""
        definition = self.get_definition(module_id)

        if (
            definition.moduleType == ModuleType.THERMOCYCLER
            and hasattr(definition.dimensions, "lidHeight")
            and definition.dimensions.lidHeight is not None
        ):
            return definition.dimensions.lidHeight
        else:
            raise errors.WrongModuleTypeError(
                f"Cannot get lid height of {definition.moduleType}"
            )

    def assert_is_magnetic_module(self, module_id: str) -> str:
        """Make sure the given module ID points to a Magnetic Module.

        Raises:
            ModuleDoesNotExistError: If ``module_id`` has not been loaded.
            WrongModuleTypeError: If ``module_id`` has been loaded,
                but it's not a Magnetic Module.

        Returns:
            The same ``module_id`` passed in.
        """
        # Propagate ModuleDoesNotExistError.
        model = self.get_model(module_id=module_id)
        if model not in [
            ModuleModel.MAGNETIC_MODULE_V1,
            ModuleModel.MAGNETIC_MODULE_V2,
        ]:
            raise errors.WrongModuleTypeError(
                f"{module_id} is a {model}, not a Magnetic Module."
            )
        return module_id

    @staticmethod
    def get_magnet_home_to_base_offset(module_model: ModuleModel) -> float:
        """Return a Magnetic Module's home offset.

        This is how far a Magnetic Module's magnets have to rise above their
        home position for their tops to be level with the bottom of the labware.

        The offset is returned in true millimeters,
        even though GEN1 Magnetic Modules are sometimes controlled in units of
        half-millimeters ("short mm").
        """
        if module_model == ModuleModel.MAGNETIC_MODULE_V1:
            offset_in_half_mm = MAGNETIC_MODULE_OFFSET_TO_LABWARE_BOTTOM[
                "magneticModuleV1"
            ]
            return offset_in_half_mm / 2
        elif module_model == ModuleModel.MAGNETIC_MODULE_V2:
            return MAGNETIC_MODULE_OFFSET_TO_LABWARE_BOTTOM["magneticModuleV2"]
        else:
            raise errors.WrongModuleTypeError(
                f"Can't get magnet offset of {module_model}."
            )

    @overload
    @classmethod
    def calculate_magnet_height(
        cls,
        *,
        module_model: ModuleModel,
        height_from_home: float,
    ) -> float:
        pass

    @overload
    @classmethod
    def calculate_magnet_height(
        cls,
        *,
        module_model: ModuleModel,
        height_from_base: float,
    ) -> float:
        pass

    @overload
    @classmethod
    def calculate_magnet_height(
        cls,
        *,
        module_model: ModuleModel,
        labware_default_height: float,
        offset_from_labware_default: float,
    ) -> float:
        pass

    @classmethod
    def calculate_magnet_height(
        cls,
        *,
        module_model: ModuleModel,
        height_from_home: Optional[float] = None,
        height_from_base: Optional[float] = None,
        labware_default_height: Optional[float] = None,
        offset_from_labware_default: Optional[float] = None,
    ) -> float:
        """Normalize a Magnetic Module engage height to standard units.

        Args:
            module_model: What kind of Magnetic Module to calculate the height for.
            height_from_home: A distance above the magnets' home position,
                in millimeters.
            heght_from_base: A distance above the labware base plane,
                in millimeters.
            labware_default_height: A distance above the labware base plane,
                in millimeters, from a labware definition.
            offset_from_labware_default: A distance from the
                ``labware_default_height`` argument, in hardware units.

        Negative values are allowed for all arguments, to move down instead of up.

        See the overload signatures for which combinations of parameters are allowed.

        Returns:
            The same height passed in, converted to be measured in
            millimeters above the module's labware base plane,
            suitable as input to a Magnetic Module engage Protocol Engine command.
        """
        if height_from_home is not None:
            home_to_base = cls.get_magnet_home_to_base_offset(module_model=module_model)
            return height_from_home - home_to_base

        elif height_from_base is not None:
            return height_from_base

        else:
            # Guaranteed statically by overload.
            assert labware_default_height is not None
            assert offset_from_labware_default is not None
            return labware_default_height + offset_from_labware_default

    @staticmethod
    def calculate_magnet_hardware_height(
        magnetic_module_model: ModuleModel, mm_from_base: float
    ) -> float:
        """Convert a human-friendly magnet height to be hardware-friendly.

        Args:
            magnetic_module_model: The model of Magnetic Module to calculate
                a height for.
            mm_from_base: The height to convert. Measured in how far the tops
                of the magnets are above the labware base plane.

        Returns:
            The same height, with its units and origin point converted
            so that it's suitable to pass to `MagDeck.engage()`.

        Raises:
            WrongModuleTypeError: If the given model is not a Magnetic Module.
            EngageHeightOutOfRangeError: If modules of the given model are
                physically incapable of reaching the requested height.
        """
        if magnetic_module_model not in [
            ModuleModel.MAGNETIC_MODULE_V1,
            ModuleModel.MAGNETIC_MODULE_V2,
        ]:
            raise errors.WrongModuleTypeError(
                f"{magnetic_module_model} is not a Magnetic Module."
            )

        hardware_units_from_base = (
            mm_from_base * 2
            if magnetic_module_model == ModuleModel.MAGNETIC_MODULE_V1
            else mm_from_base
        )
        home_to_base_offset = MAGNETIC_MODULE_OFFSET_TO_LABWARE_BOTTOM[
            magnetic_module_model
        ]
        hardware_units_from_home = home_to_base_offset + hardware_units_from_base
        if not engage_height_is_in_range(
            model=magnetic_module_model, height=hardware_units_from_home
        ):
            # TODO(mm, 2022-03-02): This error message probably will not match how
            # the user specified the height. (Hardware units versus mm,
            # home as origin versus labware base as origin.) This may be confusing
            # depending on how it propagates up.
            raise errors.EngageHeightOutOfRangeError(
                f"Invalid engage height for"
                f" {magnetic_module_model}: {hardware_units_from_home}. Must be"
                f" 0 - {MAGNETIC_MODULE_MAX_ENGAGE_HEIGHT[magnetic_module_model]}."
            )
        return hardware_units_from_home

    def should_dodge_thermocycler(
        self,
        from_slot: DeckSlotName,
        to_slot: DeckSlotName,
    ) -> bool:
        """Decide if the requested path would cross the thermocycler, if installed.

        Returns True if we need to dodge, False otherwise.
        """
        all_mods = self.get_all()
        if all_mods and ModuleModel.THERMOCYCLER_MODULE_V1 in [
            mod.model for mod in all_mods
        ]:
            transit = (from_slot, to_slot)
            if transit in _THERMOCYCLER_SLOT_TRANSITS_TO_DODGE:
                return True
        return False

    _ModuleT = TypeVar("_ModuleT", bound=AbstractModule)

    def find_loaded_hardware_module(
        self,
        module_id: str,
        attached_modules: List[AbstractModule],
        expected_type: Type[_ModuleT],
    ) -> _ModuleT:
        """Return the hardware module that corresponds to a Protocol Engine module ID.

        Should not be called when the ``use_virtual_modules`` engine config is True,
        since loaded modules will have no associated hardware modules.

        Args:
            module_id: The Protocol Engine ID of a loaded module to search for.
            attached_modules: The list of currently attached hardware modules,
                as returned by the hardware API.
            expected_type: The Python type (class) that you expect the matching
                hardware module to have.

        Returns:
            The element of ``attached_hardware_modules`` that corresponds to
            the given ``module_id`.

        Raises:
            ModuleDoesNotExistError: If module_id has not been loaded.
            ModuleNotAttachedError: If module_id has been loaded, but none of the
                attached hardware modules match it.
            WrongModuleTypeError: If a matching hardware module was found,
                but it isn't an instance of ``expected_type``.
        """
        # May raise ModuleDoesNotExistError.
        serial_number = self.get_serial_number(module_id=module_id)

        for candidate in attached_modules:
            if candidate.device_info["serial"] == serial_number:
                if isinstance(candidate, expected_type):
                    return candidate
                else:
                    raise errors.WrongModuleTypeError(
                        f'Module with serial number "{serial_number}"'
                        f' and Protocol Engine ID "{module_id}"'
                        f' is type "{type(candidate)}", but expected "{expected_type}".'
                    )
        raise errors.ModuleNotAttachedError(
            f'No module attached with serial number "{serial_number}'
            f' for Protocol Engine module ID "{module_id}".'
        )

    def select_hardware_module_to_load(
        self,
        model: ModuleModel,
        location: DeckSlotLocation,
        attached_modules: Sequence[HardwareModule],
    ) -> HardwareModule:
        """Get the next matching hardware module for the given model and location.

        If a "matching" model is found already loaded in state at the requested
        location, that hardware module will be "reused" and selected. This behavior
        allows multiple load module commands to be issued while always preserving
        module hardware instance to deck slot mapping, which is required for
        multiples-of-a-module functionality.

        Args:
            model: The requested module model. The selected module may have a
                different model if the definition lists the model as compatible.
            location: The location the module will be assigned to.
            attached_modules: All attached modules as reported by the HardwareAPI,
                in the order in which they should be used.

        Raises:
            ModuleNotAttachedError: A not-yet-assigned module matching the requested
                parameters could not be found in the attached modules list.
            ModuleAlreadyPresentError: A module of a different type is already
                assigned to the requested location.
        """
        existing_mod = self._state.hardware_module_by_slot.get(location.slotName)

        if existing_mod:
            existing_def = existing_mod.definition

            if existing_def.model == model or model in existing_def.compatibleWith:
                return existing_mod

            else:
                raise errors.ModuleAlreadyPresentError(
                    f"A {existing_def.model.value} is already"
                    f" present in {location.slotName.value}"
                )

        for m in attached_modules:
            if m not in self._state.hardware_module_by_slot.values():
                if model == m.definition.model or model in m.definition.compatibleWith:
                    return m

        raise errors.ModuleNotAttachedError(f"No available {model.value} found.")
