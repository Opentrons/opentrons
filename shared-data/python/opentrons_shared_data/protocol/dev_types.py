"""
opentrons_shared_data.protocol.dev_types: types for json protocols
"""

from typing import Any, Dict, List, Optional, Union

from typing_extensions import TypedDict, Literal
from ..pipette.dev_types import PipetteName
from ..labware.dev_types import LabwareDefinition
from ..module.dev_types import ModuleModel

SlotSpan = Literal['span7_8_10_11']


class LabwareRequirement(TypedDict):
    slot: str
    definitionId: str
    displayName: str


Metadata = TypedDict(
    'Metadata',
    {
        'protocolName': str,
        'protocol-name': str,
        'author': str,
        'description': Optional[str],
        'created': int,
        'lastModified': Optional[int],
        'last-modified': Optional[int],
        'category': Optional[str],
        'subcategory': Optional[str],
        'tags': List[str],
    },
    total=False
)


class NamedOffset(TypedDict):
    x: float
    y: float
    z: float


class ModuleRequirement(TypedDict):
    slot: str
    model: 'ModuleModel'


class RobotRequirement(TypedDict):
    model: Literal['OT-2 Standard']


class PipetteRequirement(TypedDict):
    mount: Union[Literal['left'], Literal['right']]
    name: PipetteName


class StandardLiquidHandlingParams(TypedDict):
    flowRate: float
    pipette: str
    labware: str
    well: str
    volume: float
    offsetFromBottomMm: float


class AspirateCommand(TypedDict):
    command: Literal['aspirate']
    params: StandardLiquidHandlingParams


class DispenseCommand(TypedDict):
    command: Literal['dispense']
    params: StandardLiquidHandlingParams


class AirGapCommand(TypedDict):
    command: Literal['airGap']
    params: StandardLiquidHandlingParams


class BlowoutParams(TypedDict):
    flowRate: float
    pipette: str
    labware: str
    well: str
    offsetFromBottomMm: float


class BlowoutCommand(TypedDict):
    command: Literal['blowout']
    params: BlowoutParams


class TouchTipParams(TypedDict):
    pipette: str
    labware: str
    well: str
    offsetFromBottomMm: float


class TouchTipCommand(TypedDict):
    command: Literal['touchTip']
    params: TouchTipParams


class TipHandlingParams(TypedDict):
    pipette: str
    labware: str
    well: str


class PickUpTipCommand(TypedDict):
    command: Literal['pickUpTip']
    params: TipHandlingParams


class DropTipCommand(TypedDict):
    command: Literal['dropTip']
    params: TipHandlingParams


class MoveToSlotParams(TypedDict, total=False):
    pipette: str
    slot: str
    offset: NamedOffset
    minimumZHeight: float
    forceDirect: bool


class MoveToSlotCommand(TypedDict):
    command: Literal['moveToSlot']
    params: MoveToSlotParams


class DelayParams(TypedDict, total=False):
    wait: Union[float, bool]
    message: str


class DelayCommand(TypedDict):
    command: Literal['delay']
    params: DelayParams


class MagneticModuleEngageParams(TypedDict):
    engageHeight: float
    module: str


class MagneticModuleEngageCommand(TypedDict):
    command: Literal['magneticModule/engageMagnet']
    params: MagneticModuleEngageParams


class ModuleIDParams(TypedDict):
    module: str


class MagneticModuleDisengageCommand(TypedDict):
    command: Literal['magneticModule/disengageMagnet']
    params: ModuleIDParams


class TemperatureParams(TypedDict):
    module: str
    temperature: float


class TemperatureModuleSetTargetCommand(TypedDict):
    command: Literal['temperatureModule/setTargetTemperature']
    params: TemperatureParams


class TemperatureModuleAwaitCommand(TypedDict):
    command: Literal['temperatureModule/awaitTemperature']
    params: TemperatureParams


class TemperatureModuleDeactivateCommand(TypedDict):
    command: Literal['temperatureModule/deactivate']
    params: ModuleIDParams


class ThermocyclerSetTargetBlockParams(TypedDict):
    module: str
    temperature: float
    volume: float


class ThermocyclerSetTargetBlockCommand(TypedDict):
    command: Literal['thermocycler/setTargetBlockTemperature']
    params: ThermocyclerSetTargetBlockParams


class ThermocyclerSetTargetLidCommand(TypedDict):
    command: Literal['thermocycler/setTargetLidTemperature']
    params: TemperatureParams


class ThermocyclerAwaitLidTemperatureCommand(TypedDict):
    command: Literal['thermocycler/awaitLidTemperature']
    params: TemperatureParams


class ThermocyclerAwaitBlockTemperatureCommand(TypedDict):
    command: Literal['thermocycler/awaitBlockTemperature']
    params: TemperatureParams


class ThermocyclerDeactivateBlockCommand(TypedDict):
    command: Literal['thermocycler/deactivateBlock']
    params: ModuleIDParams


class ThermocyclerDeactivateLidCommand(TypedDict):
    command: Literal['thermocycler/deactivateLid']
    params: ModuleIDParams


class ThermocyclerOpenLidCommand(TypedDict):
    command: Literal['thermocycler/openLid']
    params: ModuleIDParams


class ThermocyclerCloseLidCommand(TypedDict):
    command: Literal['thermocycler/closeLid']
    params: ModuleIDParams


class ThermocyclerCycle(TypedDict):
    temperature: float
    holdTime: float


class ThermocyclerRunProfileParams(TypedDict):
    module: str
    volume: float
    profile: List[ThermocyclerCycle]


class ThermocyclerRunProfileCommand(TypedDict):
    command: Literal['thermocycler/runProfile']
    params: ThermocyclerRunProfileParams


class ThermocyclerAwaitProfileCommand(TypedDict):
    command: Literal['thermocycler/awaitProfileComplete']
    params: ModuleIDParams


ThermocyclerCommand = Union[
    ThermocyclerAwaitProfileCommand, ThermocyclerRunProfileCommand,
    ThermocyclerCloseLidCommand, ThermocyclerOpenLidCommand,
    ThermocyclerDeactivateLidCommand, ThermocyclerDeactivateBlockCommand,
    ThermocyclerAwaitBlockTemperatureCommand,
    ThermocyclerAwaitLidTemperatureCommand,
    ThermocyclerSetTargetLidCommand, ThermocyclerSetTargetBlockCommand
]

TemperatureModuleCommand = Union[
    TemperatureModuleAwaitCommand, TemperatureModuleSetTargetCommand,
    TemperatureModuleDeactivateCommand
]

MagneticModuleCommand = Union[
    MagneticModuleEngageCommand, MagneticModuleDisengageCommand
]


ModuleCommand = Union[ThermocyclerCommand,
                      TemperatureModuleCommand,
                      MagneticModuleCommand]


PipetteCommand = Union[AspirateCommand, DispenseCommand, AirGapCommand,
                       BlowoutCommand,  TouchTipCommand, PickUpTipCommand,
                       DropTipCommand, MoveToSlotCommand]

RobotCommand = Union[DelayCommand]

Command = Union[ModuleCommand, PipetteCommand, RobotCommand]


class DesignerApplication(TypedDict):
    name: str
    version: str
    data: Dict[str, Any]


JsonProtocolV4 = TypedDict(
    'JsonProtocolV4',
    {
        "$otSharedSchema": Literal["#/protocol/schemas/4"],
        "schemaVersion": Literal[4],
        "metadata": Metadata,
        "robot": RobotRequirement,
        "pipettes": Dict[str, PipetteRequirement],
        "labware": Dict[str, LabwareRequirement],
        "labwareDefinitions": Dict[str, LabwareDefinition],
        "modules": Dict[str, ModuleRequirement],
        "commands": List[Command],
        "commandAnnotations": Dict[str, Any],
        "designerApplication": DesignerApplication
    }, total=False)
