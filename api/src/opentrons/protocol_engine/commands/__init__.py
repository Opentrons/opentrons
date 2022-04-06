"""Protocol engine command models.

The `protocol_engine.commands` module contains the data models of all
command requests and results the engine is able to handle. It also contains
models and type definitions for command resources, where a command:

- May be pending, running, completed, or failed
- Contains request and, if applicable, result data
- Has timestamps for when it was created, started, completed, and/or failed

Request and result models in the module are defined using Pydantic, because
they are part of the public input / output of the engine, and need validation
and/or schema generation.
"""

from . import heater_shaker
from . import magnetic_module

from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, CommandStatus

from .command_unions import (
    Command,
    CommandParams,
    CommandCreate,
    CommandResult,
    CommandType,
)

from .aspirate import (
    Aspirate,
    AspirateParams,
    AspirateCreate,
    AspirateResult,
    AspirateCommandType,
)

from .custom import (
    Custom,
    CustomParams,
    CustomResult,
    CustomCommandType,
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

from .home import (
    Home,
    HomeParams,
    HomeCreate,
    HomeResult,
    HomeCommandType,
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

from .pause import (
    Pause,
    PauseParams,
    PauseCreate,
    PauseResult,
    PauseCommandType,
)

from .pick_up_tip import (
    PickUpTip,
    PickUpTipParams,
    PickUpTipCreate,
    PickUpTipResult,
    PickUpTipCommandType,
)

from .save_position import (
    SavePosition,
    SavePositionParams,
    SavePositionCreate,
    SavePositionResult,
    SavePositionCommandType,
)

from .set_rail_lights import (
    SetRailLights,
    SetRailLightsParams,
    SetRailLightsCreate,
    SetRailLightsResult,
    SetRailLightsCommandType,
)


__all__ = [
    # command type unions
    "Command",
    "CommandParams",
    "CommandCreate",
    "CommandResult",
    "CommandType",
    # base interfaces
    "AbstractCommandImpl",
    "BaseCommand",
    "BaseCommandCreate",
    "CommandStatus",
    # aspirate command models
    "Aspirate",
    "AspirateCreate",
    "AspirateParams",
    "AspirateResult",
    "AspirateCommandType",
    # custom command models
    "Custom",
    "CustomParams",
    "CustomResult",
    "CustomCommandType",
    # dispense command models
    "Dispense",
    "DispenseCreate",
    "DispenseParams",
    "DispenseResult",
    "DispenseCommandType",
    # drop tip command models
    "DropTip",
    "DropTipCreate",
    "DropTipParams",
    "DropTipResult",
    "DropTipCommandType",
    # home command models
    "Home",
    "HomeParams",
    "HomeCreate",
    "HomeResult",
    "HomeCommandType",
    # load labware command models
    "LoadLabware",
    "LoadLabwareCreate",
    "LoadLabwareParams",
    "LoadLabwareResult",
    "LoadLabwareCommandType",
    # load module command models
    "LoadModule",
    "LoadModuleCreate",
    "LoadModuleParams",
    "LoadModuleResult",
    "LoadModuleCommandType",
    # load pipette command models
    "LoadPipette",
    "LoadPipetteCreate",
    "LoadPipetteParams",
    "LoadPipetteResult",
    "LoadPipetteCommandType",
    # move relative command models
    "MoveRelative",
    "MoveRelativeParams",
    "MoveRelativeCreate",
    "MoveRelativeResult",
    "MoveRelativeCommandType",
    # move to well command models
    "MoveToWell",
    "MoveToWellCreate",
    "MoveToWellParams",
    "MoveToWellResult",
    "MoveToWellCommandType",
    # pause command models
    "Pause",
    "PauseParams",
    "PauseCreate",
    "PauseResult",
    "PauseCommandType",
    # pick up tip command models
    "PickUpTip",
    "PickUpTipCreate",
    "PickUpTipParams",
    "PickUpTipResult",
    "PickUpTipCommandType",
    # save position command models
    "SavePosition",
    "SavePositionParams",
    "SavePositionCreate",
    "SavePositionResult",
    "SavePositionCommandType",
    # set rail lights command models
    "SetRailLights",
    "SetRailLightsParams",
    "SetRailLightsCreate",
    "SetRailLightsResult",
    "SetRailLightsCommandType",
    # module command bundles
    "heater_shaker",
    "magnetic_module",
]
