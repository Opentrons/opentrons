"""Command models to initialize an Absorbance Reader."""
from __future__ import annotations
from typing import Optional, Literal, TYPE_CHECKING
from typing_extensions import Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ...errors.error_occurrence import ErrorOccurrence

if TYPE_CHECKING:
    from opentrons.protocol_engine.state import StateView
    from opentrons.protocol_engine.execution import EquipmentHandler


InitializeCommandType = Literal["absorbanceReader/initialize"]


class InitializeParams(BaseModel):
    """Input parameters to initialize an absorbance reading."""

    moduleId: str = Field(..., description="Unique ID of the absorbance reader.")
    sampleWavelength: int = Field(..., description="Sample wavelength in nm.")


class InitializeResult(BaseModel):
    """Result data from initializing an aborbance reading."""


class InitializeImpl(
    AbstractCommandImpl[InitializeParams, SuccessData[InitializeResult, None]]
):
    """Execution implementation of initializing an Absorbance Reader."""

    def __init__(
        self,
        state_view: StateView,
        equipment: EquipmentHandler,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._equipment = equipment

    async def execute(
        self, params: InitializeParams
    ) -> SuccessData[InitializeResult, None]:
        """Initiate a single absorbance measurement."""
        abs_reader_substate = self._state_view.modules.get_absorbance_reader_substate(
            module_id=params.moduleId
        )
        # Allow propagation of ModuleNotAttachedError.
        abs_reader = self._equipment.get_module_hardware_api(
            abs_reader_substate.module_id
        )

        if abs_reader is not None:
            await abs_reader.set_sample_wavelength(wavelength=params.sampleWavelength)

        return SuccessData(
            public=InitializeResult(),
            private=None,
        )


class Initialize(BaseCommand[InitializeParams, InitializeResult, ErrorOccurrence]):
    """A command to initialize an Absorbance Reader."""

    commandType: InitializeCommandType = "absorbanceReader/initialize"
    params: InitializeParams
    result: Optional[InitializeResult]

    _ImplementationCls: Type[InitializeImpl] = InitializeImpl


class InitializeCreate(BaseCommandCreate[InitializeParams]):
    """A request to execute an Absorbance Reader measurement."""

    commandType: InitializeCommandType = "absorbanceReader/initialize"
    params: InitializeParams

    _CommandCls: Type[Initialize] = Initialize
