"""Basic modules data state and store."""


from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, NamedTuple, Optional, Sequence, overload
from typing_extensions import Final
from numpy import array, dot

from opentrons.hardware_control.modules import AbstractModule, MagDeck, HeaterShaker
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


class SpeedRange(NamedTuple):
    """Class defining minimum and maximum allowed speeds for a shaking module."""
    min: int
    max: int


class TemperatureRange(NamedTuple):
    """Class defining minimum and maximum allowed temperatures for a heating module."""
    min: float
    max: float


HEATER_SHAKER_TEMPERATURE_RANGE = TemperatureRange(min=37, max=95)
HEATER_SHAKER_SPEED_RANGE = SpeedRange(min=200, max=3000)


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
    """Read-only view of computed module state."""

    _state: ModuleState

    # TODO(mm, 2022-03-14): Fix this duplication between here and EngineConfigs.
    _virtualize_modules: bool

    def __init__(self, state: ModuleState, virtualize_modules: bool) -> None:
        """Initialize the view with its backing state value."""
        self._state = state
        self._virtualize_modules = virtualize_modules

    def get(self, module_id: str) -> LoadedModule:
        """Get module data by the module's unique identifier."""
        try:
            slot_name = self._state.slot_by_module_id[module_id]
            attached_module = self._state.hardware_module_by_slot[slot_name]

        except KeyError as e:
            raise errors.ModuleNotLoadedError(f"Module {module_id} not found.") from e

        return LoadedModule.construct(
            id=module_id,
            model=attached_module.definition.model,
            serialNumber=attached_module.serial_number,
            location=DeckSlotLocation(slotName=slot_name),
            definition=attached_module.definition,
        )

    def is_virtualizing_modules(self) -> bool:
        """Return whether this Protocol Engine is using virtual modules."""
        return self._virtualize_modules

    def get_all(self) -> List[LoadedModule]:
        """Get a list of all module entries in state."""
        return [self.get(mod_id) for mod_id in self._state.slot_by_module_id.keys()]

    def get_magnetic_module_view(self, module_id: str) -> MagneticModuleView:
        """Return a `MagneticModuleView` for the given Magnetic Module.

        Raises:
            ModuleNotLoadedError: If module_id has not been loaded.
            WrongModuleTypeError: If module_id has been loaded,
                but it's not a Magnetic Module.
        """
        model = self.get_model(module_id=module_id)  # Propagate ModuleNotLoadedError
        if model in [
            ModuleModel.MAGNETIC_MODULE_V1,
            ModuleModel.MAGNETIC_MODULE_V2,
        ]:
            return MagneticModuleView(parent_module_view=self, module_id=module_id)
        else:
            raise errors.WrongModuleTypeError(
                f"{module_id} is a {model}, not a Magnetic Module."
            )

    def get_heater_shaker_module_view(self, module_id: str) -> HeaterShakerModuleView:
        """Return a `HeaterShakerModuleView` for the given Heater-Shaker Module.

         Raises:
            ModuleNotLoadedError: If module_id has not been loaded.
            WrongModuleTypeError: If module_id has been loaded,
                but it's not a Heater-Shaker Module.
         """
        model = self.get_model(module_id=module_id)  # Propagate ModuleNotLoadedError
        if model == ModuleModel.HEATER_SHAKER_MODULE_V1:
            return HeaterShakerModuleView(parent_module_view=self, module_id=module_id)
        else:
            raise errors.WrongModuleTypeError(
                f"{module_id} is a {model}, not a Heater-Shaker Module."
            )

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
    def is_target_temperature_valid(
            heating_module_model: ModuleModel, celsius: float
    ) -> bool:
        """Verify that the target temperature being set is valid for the module type."""
        if heating_module_model == ModuleModel.HEATER_SHAKER_MODULE_V1:
            return (HEATER_SHAKER_TEMPERATURE_RANGE.min
                    <= celsius <= HEATER_SHAKER_TEMPERATURE_RANGE.max)
        elif heating_module_model == ModuleModel.THERMOCYCLER_MODULE_V1:
            raise NotImplementedError("Temperature validation for Thermocycler "
                                      "not implemented yet")
        elif heating_module_model in [ModuleModel.TEMPERATURE_MODULE_V1,
                                      ModuleModel.TEMPERATURE_MODULE_V2]:
            raise NotImplementedError("Temperature validation for Temperature Module"
                                      "not implemented yet.")
        else:
            raise errors.WrongModuleTypeError(
                f"{heating_module_model} is not a heating module."
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


class MagneticModuleView:
    """A Magnetic Module view.

    Provides calculations and read-only state access
    for an individual loaded Magnetic Module.
    """

    def __init__(self, parent_module_view: ModuleView, module_id: str) -> None:
        """Initialize the `MagneticModuleView`.

        Do not use this initializer directly, except in tests.
        Use `ModuleView.get_magnetic_module_view()` instead.
        """
        self.parent_module_view: Final = parent_module_view
        self.module_id: Final = module_id

    def find_hardware(
        self, attached_modules: List[AbstractModule]
    ) -> Optional[MagDeck]:
        """Find the matching attached hardware module.

        Params:
            attached_modules: The list of attached hardware modules,
                from the `HardwareControlAPI`, to search.
                If the Protocol Engine is using virtual modules,
                there are no meaningful "attached hardware modules,"
                so this list is ignored.

        Returns:
            If the Protocol Engine is using virtual modules, returns ``None``.
            If not, returns the element of attached_modules that corresponds to
            the same individual module as this `MagneticModuleView`.

        Raises:
            ModuleNotAttachedError: If no match was found in ``attached_modules``,
                and the Protocol Engine is *not* using virtual modules.
        """
        if self.parent_module_view.is_virtualizing_modules():
            return None
        else:
            serial_number = self.parent_module_view.get_serial_number(
                module_id=self.module_id
            )
            for candidate in attached_modules:
                if candidate.device_info["serial"] == serial_number and isinstance(
                    candidate, MagDeck
                ):
                    return candidate
            # This will report a mismatched module type as ModuleNotAttachedError
            # instead of WrongModuleTypeError, but that's fine because that
            # shouldn't be possible anyway. (It should be caught at module load.)
            raise errors.ModuleNotAttachedError(
                f'No module attached with serial number "{serial_number}'
                f' for Protocol Engine module ID "{self.module_id}".'
            )

    def calculate_magnet_hardware_height(self, mm_from_base: float) -> float:
        """Convert a human-friendly magnet height to be hardware-friendly.

        Args:
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
        model = self.parent_module_view.get_model(self.module_id)
        if model not in [
            ModuleModel.MAGNETIC_MODULE_V1,
            ModuleModel.MAGNETIC_MODULE_V2,
        ]:
            # Shouldn't be possible; should have been caught during load time.
            raise errors.WrongModuleTypeError(f"{model} is not a Magnetic Module.")

        hardware_units_from_base = (
            mm_from_base * 2
            if model == ModuleModel.MAGNETIC_MODULE_V1
            else mm_from_base
        )
        home_to_base_offset = MAGNETIC_MODULE_OFFSET_TO_LABWARE_BOTTOM[model]
        hardware_units_from_home = home_to_base_offset + hardware_units_from_base
        if not engage_height_is_in_range(model=model, height=hardware_units_from_home):
            # TODO(mm, 2022-03-02): This error message probably will not match how
            # the user specified the height. (Hardware units versus mm,
            # home as origin versus labware base as origin.) This may be confusing
            # depending on how it propagates up.
            raise errors.EngageHeightOutOfRangeError(
                f"Invalid engage height for {model}:"
                f" {hardware_units_from_home}. Must be"
                f" 0 - {MAGNETIC_MODULE_MAX_ENGAGE_HEIGHT[model]}."
            )
        return hardware_units_from_home


class HeaterShakerModuleView:
    """A Heater-Shaker Module view.

    Provides calculations and read-only state access
    for an individual loaded Heater-Shaker Module.
    """

    def __init__(self, parent_module_view: ModuleView, module_id: str) -> None:
        """Initialize the `HeaterShakerModuleView`.

        Do not use this initializer directly, except in tests.
        Use `ModuleView.get_heater_shaker_module_view()` instead.
        """
        self.parent_module_view: Final = parent_module_view
        self.module_id: Final = module_id

    def find_hardware(
        self, attached_modules: List[AbstractModule]
    ) -> Optional[HeaterShaker]:
        """Find the matching attached hardware module.

        Params:
            attached_modules: The list of attached hardware modules,
                from the `HardwareControlAPI`, to search.
                If the Protocol Engine is using virtual modules,
                there are no meaningful "attached hardware modules,"
                so this list is ignored.

        Returns:
            If the Protocol Engine is using virtual modules, returns ``None``.
            If not, returns the element of attached_modules that corresponds to
            the same individual module as this `HeaterShakerModuleView`.

        Raises:
            ModuleNotAttachedError: If no match was found in ``attached_modules``,
                and the Protocol Engine is *not* using virtual modules.
        """
        if self.parent_module_view.is_virtualizing_modules():
            return None
        else:
            serial_number = self.parent_module_view.get_serial_number(
                module_id=self.module_id
            )
            for candidate in attached_modules:
                if candidate.device_info["serial"] == serial_number and isinstance(
                    candidate, HeaterShaker
                ):
                    return candidate
            # This will report a mismatched module type as ModuleNotAttachedError
            # instead of WrongModuleTypeError, but that's fine because that
            # shouldn't be possible anyway. (It should be caught at module load.)
            raise errors.ModuleNotAttachedError(
                f'No module attached with serial number "{serial_number}'
                f' for Protocol Engine module ID "{self.module_id}".'
            )

    @staticmethod
    def is_target_temperature_valid(celsius: float) -> bool:
        """Verify that the target temperature being set is valid for heater-shaker."""
        return (HEATER_SHAKER_TEMPERATURE_RANGE.min
                <= celsius <= HEATER_SHAKER_TEMPERATURE_RANGE.max)
