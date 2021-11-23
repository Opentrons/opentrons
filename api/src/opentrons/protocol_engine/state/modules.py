"""Basic modules data state and store."""
from dataclasses import dataclass, replace
from typing import Dict, List, Optional

from ..types import LoadedModule, ModuleModels, ModuleDefinition
from .. import errors
from ..commands import Command, LoadModuleResult
from ..actions import Action, UpdateCommandAction
from .abstract_store import HasState, HandlesActions


@dataclass(frozen=True)
class HardwareModule:
    """Hardware module data."""


@dataclass(frozen=True)
class ModuleState:
    """Basic module data state and getter methods."""
    modules_by_id: Dict[str, LoadedModule]
    definition_by_model: Dict[ModuleModels, ModuleDefinition]


class ModuleStore(HasState[ModuleState], HandlesActions):
    """Module state container."""

    _state: ModuleState

    def __init__(self) -> None:
        """Initialize a ModuleStore and its state."""
        self._state = ModuleState(modules_by_id={})

    def handle_action(self, action: Action) -> None:
        """Modify state in reaction to an action."""
        if isinstance(action, UpdateCommandAction):
            self._handle_command(action.command)

    def _handle_command(self, command: Command) -> None:
        if isinstance(command.result, LoadModuleResult):
            module_id = command.result.moduleId
            new_module_by_id = self._state.modules_by_id.copy()
            new_module_by_id[module_id] = LoadedModule(
                id=module_id,
                model=command.params.model,
                location=command.params.location,
                serial=command.result.moduleSerial,
                definition=command.result.definition
            )

            new_definition_by_model = self._state.definition_by_model.copy()
            new_definition_by_model[command.params.model] = command.result.definition

            self._state = replace(
                self._state,
                modules_by_id=new_module_by_id,
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

    def get_definition_by_id(self, module_id) -> ModuleDefinition:
        """Module definition by ID."""
        return self.get(module_id).definition

    def get_definition_by_model(
            self,
            model: ModuleModels
    ) -> ModuleDefinition:
        """Return module definition by model."""
        try:
            return self._state.definition_by_model[model]
        except KeyError as e:
            raise errors.ModuleDefinitionDoesNotExistError(
                f"Module definition for matching {model} not found."
            ) from e

    def get_by_serial(self, serial: str) -> LoadedModule:
        """Get a loaded module by its serial number."""
        for mod in self.get_all():
            if mod.serial == serial:
                return mod
