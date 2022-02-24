"""Basic modules data state and store."""
from dataclasses import dataclass
from typing import Dict, List, NamedTuple, Optional, Sequence, overload
from numpy import array, dot

from opentrons.hardware_control.modules.magdeck import (
    OFFSET_TO_LABWARE_BOTTOM as MAGNETIC_MODULE_OFFSET_TO_LABWARE_BOTTOM,
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

        except KeyError:
            raise errors.ModuleDoesNotExistError(f"Module {module_id} not found.")

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

    @staticmethod
    def get_magnet_true_mm_home_to_base(module_model: ModuleModel) -> float:
        """Return a Magnetic Module's home offset.

        This is how far a Magnetic Module's magnets have to rise above their
        home position for their tops to be level with the bottom of the labware.

        This function always returns the offset in of true millimeters,
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
    def calculate_magnet_true_mm_above_base(
        cls,
        *,
        module_model: ModuleModel,
        hardware_units_above_home: float,
    ) -> float:
        pass

    @overload
    @classmethod
    def calculate_magnet_true_mm_above_base(
        cls,
        *,
        module_model: ModuleModel,
        hardware_units_above_base: float,
    ) -> float:
        pass

    @overload
    @classmethod
    def calculate_magnet_true_mm_above_base(
        cls,
        *,
        module_model: ModuleModel,
        labware_default_true_mm_above_base: float,
        hardware_units_above_labware_default: float,
    ) -> float:
        pass

    @classmethod
    def calculate_magnet_true_mm_above_base(
        cls,
        *,
        module_model: ModuleModel,
        hardware_units_above_home: Optional[float] = None,
        hardware_units_above_base: Optional[float] = None,
        labware_default_true_mm_above_base: Optional[float] = None,
        hardware_units_above_labware_default: Optional[float] = None,
    ) -> float:
        """Normalize a Magnetic Module engage height to standard units.

        Args:
            module_model: What kind of Magnetic Module to calculate the height for.
                If GEN1, "hardware units" in other arguments are half-millimeters.
                Otherwise, they're true millimeters.
            hardware_units_above_home: A distance above the magnets' home position,
                in hardware units.
            hardware_units_above_base: A distance above the labware base plane,
                in hardware units.
            labware_default_true_mm_above_base: A distance above the labware base plane,
                in true millimeters, from a labware definition.
            hardware_units_above_labware_default: A distance above the
                ``labware_default_true_mm_above_base`` argument, in hardware units.

        Negative values are allowed for all arguments, to move down instead of up.

        Returns:
            The same distance, measured in true physical millimeters above the
            module's base labware plane.
        """
        if hardware_units_above_home is not None:
            # FIXME(mm, 2022-02-22): This arithmetic is wrong for GEN1 modules
            # because it mixes units.
            true_mm_home_to_base = cls.get_magnet_true_mm_home_to_base(
                module_model=module_model
            )
            return hardware_units_above_home - true_mm_home_to_base

        elif hardware_units_above_base is not None:
            # FIXME(mm, 2022-02-24): This is wrong for GEN1 modules
            # because hardware units are not true millimeters.
            return hardware_units_above_base

        else:
            # Guaranteed statically by overload.
            assert labware_default_true_mm_above_base is not None
            assert hardware_units_above_labware_default is not None

            # FIXME(mm, 2022-02-24): This arithmetic is wrong for GEN1 modules
            # because it mixes units.
            return (
                labware_default_true_mm_above_base
                + hardware_units_above_labware_default
            )

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

    def find_attached_module(
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
