"""Union types of concrete command definitions."""
from typing import Union

from .add_labware_definition import (
    AddLabwareDefinition,
    AddLabwareDefinitionRequest,
    AddLabwareDefinitionResult,
    AddLabwareDefinitionCommandType,
)

from .aspirate import Aspirate, AspirateRequest, AspirateResult, AspirateCommandType

from .dispense import Dispense, DispenseRequest, DispenseResult, DispenseCommandType

from .drop_tip import DropTip, DropTipRequest, DropTipResult, DropTipCommandType

from .load_labware import (
    LoadLabware,
    LoadLabwareRequest,
    LoadLabwareResult,
    LoadLabwareCommandType,
)

from .load_pipette import (
    LoadPipette,
    LoadPipetteRequest,
    LoadPipetteResult,
    LoadPipetteCommandType,
)

from .move_to_well import (
    MoveToWell,
    MoveToWellRequest,
    MoveToWellResult,
    MoveToWellCommandType,
)

from .pick_up_tip import (
    PickUpTip,
    PickUpTipRequest,
    PickUpTipResult,
    PickUpTipCommandType,
)

from .pause import (
    Pause,
    PauseRequest,
    PauseResult,
    PauseCommandType,
)

Command = Union[
    AddLabwareDefinition,
    Aspirate,
    Dispense,
    DropTip,
    LoadLabware,
    LoadPipette,
    MoveToWell,
    PickUpTip,
    Pause,
]

CommandType = Union[
    AddLabwareDefinitionCommandType,
    AspirateCommandType,
    DispenseCommandType,
    DropTipCommandType,
    LoadLabwareCommandType,
    LoadPipetteCommandType,
    MoveToWellCommandType,
    PickUpTipCommandType,
    PauseCommandType,
]

CommandRequest = Union[
    AddLabwareDefinitionRequest,
    AspirateRequest,
    DispenseRequest,
    DropTipRequest,
    LoadLabwareRequest,
    LoadPipetteRequest,
    MoveToWellRequest,
    PickUpTipRequest,
    PauseRequest,
]

CommandResult = Union[
    AddLabwareDefinitionResult,
    AspirateResult,
    DispenseResult,
    DropTipResult,
    LoadLabwareResult,
    LoadPipetteResult,
    MoveToWellResult,
    PickUpTipResult,
    PauseResult,
]
