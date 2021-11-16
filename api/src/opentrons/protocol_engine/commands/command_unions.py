"""Union types of concrete command definitions."""

from typing import Union

from .add_labware_definition import (
    AddLabwareDefinition,
    AddLabwareDefinitionCreate,
    AddLabwareDefinitionResult,
    AddLabwareDefinitionCommandType,
)

from .aspirate import Aspirate, AspirateCreate, AspirateResult, AspirateCommandType

from .dispense import Dispense, DispenseCreate, DispenseResult, DispenseCommandType

from .drop_tip import DropTip, DropTipCreate, DropTipResult, DropTipCommandType

from .load_labware import (
    LoadLabware,
    LoadLabwareCreate,
    LoadLabwareResult,
    LoadLabwareCommandType,
)

from .load_module import (
    LoadModule,
    LoadModuleCreate,
    LoadModuleResult,
    LoadModuleCommandType,
)

from .load_pipette import (
    LoadPipette,
    LoadPipetteCreate,
    LoadPipetteResult,
    LoadPipetteCommandType,
)

from .home import Home, HomeCreate, HomeResult, HomeCommandType

from .move_relative import (
    MoveRelative,
    MoveRelativeCreate,
    MoveRelativeResult,
    MoveRelativeCommandType,
)

from .move_to_well import (
    MoveToWell,
    MoveToWellCreate,
    MoveToWellResult,
    MoveToWellCommandType,
)

from .pick_up_tip import (
    PickUpTip,
    PickUpTipCreate,
    PickUpTipResult,
    PickUpTipCommandType,
)

from .pause import (
    Pause,
    PauseCreate,
    PauseResult,
    PauseCommandType,
)

from .save_position import (
    SavePosition,
    SavePositionCreate,
    SavePositionResult,
    SavePositionCommandType,
)

from .custom import (
    Custom,
    CustomResult,
    CustomCommandType,
)

Command = Union[
    AddLabwareDefinition,
    Aspirate,
    Dispense,
    DropTip,
    LoadLabware,
    LoadModule,
    LoadPipette,
    Home,
    MoveRelative,
    MoveToWell,
    PickUpTip,
    Pause,
    SavePosition,
    Custom,
]

CommandType = Union[
    AddLabwareDefinitionCommandType,
    AspirateCommandType,
    DispenseCommandType,
    DropTipCommandType,
    LoadLabwareCommandType,
    LoadModuleCommandType,
    LoadPipetteCommandType,
    HomeCommandType,
    MoveRelativeCommandType,
    MoveToWellCommandType,
    PickUpTipCommandType,
    PauseCommandType,
    SavePositionCommandType,
    CustomCommandType,
]

CommandCreate = Union[
    AddLabwareDefinitionCreate,
    AspirateCreate,
    DispenseCreate,
    DropTipCreate,
    LoadLabwareCreate,
    LoadModuleCreate,
    LoadPipetteCreate,
    HomeCreate,
    MoveRelativeCreate,
    MoveToWellCreate,
    PickUpTipCreate,
    PauseCreate,
    SavePositionCreate,
]

CommandResult = Union[
    AddLabwareDefinitionResult,
    AspirateResult,
    DispenseResult,
    DropTipResult,
    LoadLabwareResult,
    LoadModuleResult,
    LoadPipetteResult,
    HomeResult,
    MoveRelativeResult,
    MoveToWellResult,
    PickUpTipResult,
    PauseResult,
    SavePositionResult,
    CustomResult,
]
