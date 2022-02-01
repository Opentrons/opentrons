"""Union types of concrete command definitions."""

from typing import Union

from .aspirate import (
    Aspirate,
    AspirateParams,
    AspirateCreate,
    AspirateResult,
    AspirateCommandType,
)

from .dispense import (
    Dispense,
    DispenseParams,
    DispenseCreate,
    DispenseResult,
    DispenseCommandType,
)

from .drop_tip import (
    DropTip,
    DropTipParams,
    DropTipCreate,
    DropTipResult,
    DropTipCommandType,
)

from .load_labware import (
    LoadLabware,
    LoadLabwareParams,
    LoadLabwareCreate,
    LoadLabwareResult,
    LoadLabwareCommandType,
)

from .load_module import (
    LoadModule,
    LoadModuleParams,
    LoadModuleCreate,
    LoadModuleResult,
    LoadModuleCommandType,
)

from .load_pipette import (
    LoadPipette,
    LoadPipetteParams,
    LoadPipetteCreate,
    LoadPipetteResult,
    LoadPipetteCommandType,
)

from .home import Home, HomeParams, HomeCreate, HomeResult, HomeCommandType

from .move_relative import (
    MoveRelative,
    MoveRelativeParams,
    MoveRelativeCreate,
    MoveRelativeResult,
    MoveRelativeCommandType,
)

from .move_to_well import (
    MoveToWell,
    MoveToWellParams,
    MoveToWellCreate,
    MoveToWellResult,
    MoveToWellCommandType,
)

from .pick_up_tip import (
    PickUpTip,
    PickUpTipParams,
    PickUpTipCreate,
    PickUpTipResult,
    PickUpTipCommandType,
)

from .pause import (
    Pause,
    PauseParams,
    PauseCreate,
    PauseResult,
    PauseCommandType,
)

from .save_position import (
    SavePosition,
    SavePositionParams,
    SavePositionCreate,
    SavePositionResult,
    SavePositionCommandType,
)

from .custom import (
    Custom,
    CustomParams,
    CustomResult,
    CustomCommandType,
)

Command = Union[
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

CommandParams = Union[
    AspirateParams,
    DispenseParams,
    DropTipParams,
    LoadLabwareParams,
    LoadModuleParams,
    LoadPipetteParams,
    HomeParams,
    MoveRelativeParams,
    MoveToWellParams,
    PickUpTipParams,
    PauseParams,
    SavePositionParams,
    CustomParams,
]

CommandType = Union[
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
