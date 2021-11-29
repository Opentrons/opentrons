"""Basic modules data state and store."""
from dataclasses import dataclass, replace
from typing import Dict, List, Optional
from numpy import array, dot

from ..types import (
    LoadedModule,
    ModuleModel,
    ModuleDefinition,
    DeckSlotLocation,
    ModuleDimensions,
    LabwareOffsetVector,
)
from .. import errors
from ..commands import Command, LoadModuleResult
from ..actions import Action, UpdateCommandAction
from .abstract_store import HasState, HandlesActions


@dataclass(frozen=True)
class ModuleState:
    """Basic module data state and getter methods."""

    modules_by_id: Dict[str, LoadedModule]

    # TODO (spp, 2021-11-24): remove definition_by_model and
    #  unconditionally fetch definitions from ModuleDataProvider
    definition_by_model: Dict[ModuleModel, ModuleDefinition]


class ModuleStore(HasState[ModuleState], HandlesActions):
    """Module state container."""

    _state: ModuleState

    def __init__(self) -> None:
        """Initialize a ModuleStore and its state."""
        self._state = ModuleState(modules_by_id={}, definition_by_model={})

    def handle_action(self, action: Action) -> None:
        """Modify state in reaction to an action."""
        if isinstance(action, UpdateCommandAction):
            self._handle_command(action.command)

    def _handle_command(self, command: Command) -> None:
        if isinstance(command.result, LoadModuleResult):
            module_id = command.result.moduleId
            new_modules_by_id = self._state.modules_by_id.copy()
            new_modules_by_id[module_id] = LoadedModule(
                id=module_id,
                model=command.params.model,
                location=command.params.location,
                serial=command.result.moduleSerial,
                definition=command.result.definition,
            )

            new_definition_by_model = self._state.definition_by_model.copy()
            new_definition_by_model[command.params.model] = command.result.definition

            self._state = replace(
                self._state,
                modules_by_id=new_modules_by_id,
                definition_by_model=new_definition_by_model,
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
            return self._state.modules_by_id[module_id]
        except KeyError:
            raise errors.ModuleDoesNotExistError(f"Module {module_id} not found.")

    def get_all(self) -> List[LoadedModule]:
        """Get a list of all module entries in state."""
        mod_list = []
        for mod in self._state.modules_by_id.values():
            mod_list.append(mod)
        return mod_list

    def get_location(self, module_id: str) -> DeckSlotLocation:
        """Get the slot location of the given module."""
        return self._state.modules_by_id[module_id].location

    def get_definition_by_id(self, module_id: str) -> ModuleDefinition:
        """Module definition by ID."""
        return self.get(module_id).definition

    def get_definition_by_model(self, model: ModuleModel) -> ModuleDefinition:
        """Return module definition by model."""
        try:
            return self._state.definition_by_model[model]
        except KeyError as e:
            raise errors.ModuleDefinitionDoesNotExistError(
                f"Module definition for matching {model} not found."
            ) from e

    def get_by_serial(self, serial: str) -> Optional[LoadedModule]:
        """Get a loaded module by its serial number."""
        for mod in self.get_all():
            if mod.serial == serial:
                return mod
        return None

    def get_dimensions(self, module_id: str) -> ModuleDimensions:
        """Get the specified module's dimensions."""
        return self._state.modules_by_id[module_id].definition.dimensions

    def get_module_offset(self, module_id: str) -> LabwareOffsetVector:
        """Get the module's offset vector computed with slot transform."""
        definition = self.get_definition_by_id(module_id)
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
            x=xformed[0], y=xformed[1], z=definition.labwareOffset.z
        )

    def get_overall_height(self, module_id: str) -> float:
        """Get the height of the module."""
        return self.get_definition_by_id(module_id).dimensions.bareOverallHeight

    def get_height_over_labware(self, module_id: str) -> float:
        """Get the height of module parts above module labware base."""
        return self.get_definition_by_id(module_id).dimensions.overLabwareHeight

    def get_lid_height(self, module_id: str) -> float:
        """Get lid height if module is thermocycler."""
        definition = self.get_definition_by_id(module_id)

        if (
            definition.moduleType == "thermocyclerModuleType"
            and hasattr(definition.dimensions, "lidHeight")
            and definition.dimensions.lidHeight is not None
        ):
            return definition.dimensions.lidHeight
        else:
            raise errors.ModuleIsNotThermocyclerError(
                f"Cannot get lid height of {definition.moduleType}"
            )

    def get_module_by_location(
        self, deck_location: DeckSlotLocation
    ) -> Optional[LoadedModule]:
        """Get the module loaded in the given slot."""
        for mod in self.get_all():
            if mod.location == deck_location:
                return mod
        return None
