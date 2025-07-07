"""Command models to prepare the stacker shuttle for movement."""

from __future__ import annotations

from __future__ import annotations
from typing import Literal, Union, TYPE_CHECKING
from typing_extensions import Type

from pydantic import BaseModel, Field

from opentrons_shared_data.errors.exceptions import FlexStackerStallError

from ..flex_stacker.common import FlexStackerStallOrCollisionError
from ..command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    SuccessData,
    DefinedErrorData,
)
from ...errors import ErrorOccurrence
from ...resources import ModelUtils

if TYPE_CHECKING:
    from ...state.state import StateView
    from ...execution import EquipmentHandler

UnsafeFlexStackerPrepareShuttleCommandType = Literal[
    "unsafe/flexStacker/prepareShuttle"
]


class UnsafeFlexStackerPrepareShuttleParams(BaseModel):
    """The parameters for a UnsafeFlexStackerPrepareShuttle command."""

    moduleId: str = Field(..., description="Unique ID of the Flex Stacker")
    ignoreLatch: bool = Field(
        default=False, description="Ignore the latch state of the shuttle"
    )


class UnsafeFlexStackerPrepareShuttleResult(BaseModel):
    """Result data from a stacker UnsafeFlexStackerPrepareShuttle command."""


_ExecuteReturn = Union[
    SuccessData[UnsafeFlexStackerPrepareShuttleResult],
    DefinedErrorData[FlexStackerStallOrCollisionError],
]


class UnsafeFlexStackerPrepareShuttleImpl(
    AbstractCommandImpl[UnsafeFlexStackerPrepareShuttleParams, _ExecuteReturn]
):
    """Implementation of a stacker prepare shuttle command."""

    def __init__(
        self,
        state_view: StateView,
        equipment: EquipmentHandler,
        model_utils: ModelUtils,
        **kwargs: object,
    ) -> None:
        self._state_view = state_view
        self._equipment = equipment
        self._model_utils = model_utils

    async def execute(
        self, params: UnsafeFlexStackerPrepareShuttleParams
    ) -> _ExecuteReturn:
        """Execute the stacker prepare shuttle command.

        Moving the shuttle directly affects the state of the flex stacker and
        could affect its ability to execute the next command. This command
        should be used with care.
        """
        stacker_state = self._state_view.modules.get_flex_stacker_substate(
            params.moduleId
        )
        # Allow propagation of ModuleNotAttachedError.
        stacker_hw = self._equipment.get_module_hardware_api(stacker_state.module_id)

        try:
            if stacker_hw is not None:
                await stacker_hw.home_all(params.ignoreLatch)
        except FlexStackerStallError as e:
            return DefinedErrorData(
                public=FlexStackerStallOrCollisionError(
                    id=self._model_utils.generate_id(),
                    createdAt=self._model_utils.get_timestamp(),
                    wrappedErrors=[
                        ErrorOccurrence.from_failed(
                            id=self._model_utils.generate_id(),
                            createdAt=self._model_utils.get_timestamp(),
                            error=e,
                        )
                    ],
                    errorInfo={},
                ),
            )
        # TODO we should also add a check for shuttle not detected error

        return SuccessData(public=UnsafeFlexStackerPrepareShuttleResult())


class UnsafeFlexStackerPrepareShuttle(
    BaseCommand[
        UnsafeFlexStackerPrepareShuttleParams,
        UnsafeFlexStackerPrepareShuttleResult,
        ErrorOccurrence,
    ]
):
    """A command to prepare Flex Stacker shuttle."""

    commandType: UnsafeFlexStackerPrepareShuttleCommandType = (
        "unsafe/flexStacker/prepareShuttle"
    )
    params: UnsafeFlexStackerPrepareShuttleParams
    result: UnsafeFlexStackerPrepareShuttleResult | None = None

    _ImplementationCls: Type[
        UnsafeFlexStackerPrepareShuttleImpl
    ] = UnsafeFlexStackerPrepareShuttleImpl


class UnsafeFlexStackerPrepareShuttleCreate(
    BaseCommandCreate[UnsafeFlexStackerPrepareShuttleParams]
):
    """A request to execute a Flex Stacker UnsafeFlexStackerPrepareShuttle command."""

    commandType: UnsafeFlexStackerPrepareShuttleCommandType = (
        "unsafe/flexStacker/prepareShuttle"
    )
    params: UnsafeFlexStackerPrepareShuttleParams

    _CommandCls: Type[UnsafeFlexStackerPrepareShuttle] = UnsafeFlexStackerPrepareShuttle
