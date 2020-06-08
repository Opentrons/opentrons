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

AspirateCommandId = Literal['aspirate']
DispenseCommandId = Literal['dispense']
AirGapCommandId = Literal['airGap']
BlowoutCommandId = Literal['blowout']
TouchTipCommandId = Literal['touchTip']
PickUpTipCommandId = Literal['pickUpTip']
DropTipCommandId = Literal['dropTip']
MoveToSlotCommandId = Literal['moveToSlot']
DelayCommandId = Literal['delay']
MagneticModuleEngageCommandId = Literal['magneticModule/engageMagnet']
MagneticModuleDisengageCommandId = Literal['magneticModule/disengageMagnet']
TemperatureModuleSetTargetCommandId\
    = Literal['temperatureModule/setTargetTemperature']
TemperatureModuleAwaitCommandId = Literal['temperatureModule/awaitTemperature']
TemperatureModuleDeactivateCommandId = Literal['temperatureModule/deactivate']
ThermocyclerSetTargetBlockCommandId\
    = Literal['thermocycler/setTargetBlockTemperature']
ThermocyclerSetTargetLidCommandId\
    = Literal['thermocycler/setTargetLidTemperature']
ThermocyclerAwaitLidTemperatureCommandId \
    = Literal['thermocycler/awaitLidTemperature']
ThermocyclerAwaitBlockTemperatureCommandId \
    = Literal['thermocycler/awaitBlockTemperature']
ThermocyclerDeactivateBlockCommandId = Literal['thermocycler/deactivateBlock']
ThermocyclerDeactivateLidCommandId = Literal['thermocycler/deactivateLid']
ThermocyclerOpenLidCommandId = Literal['thermocycler/openLid']
ThermocyclerCloseLidCommandId = Literal['thermocycler/closeLid']
ThermocyclerRunProfileCommandId = Literal['thermocycler/runProfile']
ThermocyclerAwaitProfileCommandId\
    = Literal['thermocycler/awaitProfileComplete']


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


class PipetteAccessParams(TypedDict):
    pipette: str
    labware: str
    well: str


class FlowRateParams(TypedDict):
    flowRate: float


class PipetteAccessWithOffsetParams(PipetteAccessParams):
    offsetFromBottomMm: float


class StandardLiquidHandlingParams(
        PipetteAccessWithOffsetParams, FlowRateParams):
    volume: float


class AspirateCommand(TypedDict):
    command: AspirateCommandId
    params: StandardLiquidHandlingParams


class DispenseCommand(TypedDict):
    command: DispenseCommandId
    params: StandardLiquidHandlingParams


class AirGapCommand(TypedDict):
    command: AirGapCommandId
    params: StandardLiquidHandlingParams


class BlowoutParams(PipetteAccessWithOffsetParams, FlowRateParams):
    pass


class BlowoutCommand(TypedDict):
    command: BlowoutCommandId
    params: BlowoutParams


class TouchTipParams(PipetteAccessParams):
    offsetFromBottomMm: float


class TouchTipCommand(TypedDict):
    command: TouchTipCommandId
    params: TouchTipParams


class PickUpTipCommand(TypedDict):
    command: PickUpTipCommandId
    params: PipetteAccessParams


class DropTipCommand(TypedDict):
    command: DropTipCommandId
    params: PipetteAccessParams


class MoveToSlotParams(TypedDict, total=False):
    pipette: str
    slot: str
    offset: NamedOffset
    minimumZHeight: float
    forceDirect: bool


class MoveToSlotCommand(TypedDict):
    command: MoveToSlotCommandId
    params: MoveToSlotParams


class DelayParams(TypedDict, total=False):
    wait: Union[float, bool]
    message: str


class DelayCommand(TypedDict):
    command: DelayCommandId
    params: DelayParams


class ModuleIDParams(TypedDict):
    module: str


class MagneticModuleEngageParams(ModuleIDParams):
    engageHeight: float


class MagneticModuleEngageCommand(TypedDict):
    command: MagneticModuleEngageCommandId
    params: MagneticModuleEngageParams


class MagneticModuleDisengageCommand(TypedDict):
    command: MagneticModuleDisengageCommandId
    params: ModuleIDParams


class TemperatureParams(ModuleIDParams):
    temperature: float


class TemperatureModuleSetTargetCommand(TypedDict):
    command: TemperatureModuleSetTargetCommandId
    params: TemperatureParams


class TemperatureModuleAwaitCommand(TypedDict):
    command: TemperatureModuleAwaitCommandId
    params: TemperatureParams


class TemperatureModuleDeactivateCommand(TypedDict):
    command: TemperatureModuleDeactivateCommandId
    params: ModuleIDParams


class ThermocyclerSetTargetBlockParams(TemperatureParams):
    volume: float


class ThermocyclerSetTargetBlockCommand(TypedDict):
    command: ThermocyclerSetTargetBlockCommandId
    params: ThermocyclerSetTargetBlockParams


class ThermocyclerSetTargetLidCommand(TypedDict):
    command: ThermocyclerSetTargetLidCommandId
    params: TemperatureParams


class ThermocyclerAwaitLidTemperatureCommand(TypedDict):
    command: ThermocyclerAwaitLidTemperatureCommandId
    params: TemperatureParams


class ThermocyclerAwaitBlockTemperatureCommand(TypedDict):
    command: ThermocyclerAwaitBlockTemperatureCommandId
    params: TemperatureParams


class ThermocyclerDeactivateBlockCommand(TypedDict):
    command: ThermocyclerDeactivateBlockCommandId
    params: ModuleIDParams


class ThermocyclerDeactivateLidCommand(TypedDict):
    command: ThermocyclerDeactivateLidCommandId
    params: ModuleIDParams


class ThermocyclerOpenLidCommand(TypedDict):
    command: ThermocyclerOpenLidCommandId
    params: ModuleIDParams


class ThermocyclerCloseLidCommand(TypedDict):
    command: ThermocyclerCloseLidCommandId
    params: ModuleIDParams


class ThermocyclerCycle(TypedDict):
    temperature: float
    holdTime: float


class ThermocyclerRunProfileParams(TypedDict):
    module: str
    volume: float
    profile: List[ThermocyclerCycle]


class ThermocyclerRunProfileCommand(TypedDict):
    command: ThermocyclerRunProfileCommandId
    params: ThermocyclerRunProfileParams


class ThermocyclerAwaitProfileCommand(TypedDict):
    command: ThermocyclerAwaitProfileCommandId
    params: ModuleIDParams


ThermocyclerCommand = Union[
    ThermocyclerAwaitProfileCommand, ThermocyclerRunProfileCommand,
    ThermocyclerCloseLidCommand, ThermocyclerOpenLidCommand,
    ThermocyclerDeactivateLidCommand, ThermocyclerDeactivateBlockCommand,
    ThermocyclerAwaitBlockTemperatureCommand,
    ThermocyclerAwaitLidTemperatureCommand,
    ThermocyclerSetTargetLidCommand, ThermocyclerSetTargetBlockCommand
]
ThermocyclerCommandId = Union[
    ThermocyclerAwaitProfileCommandId, ThermocyclerRunProfileCommandId,
    ThermocyclerCloseLidCommandId, ThermocyclerOpenLidCommandId,
    ThermocyclerDeactivateLidCommandId, ThermocyclerDeactivateBlockCommandId,
    ThermocyclerAwaitBlockTemperatureCommandId,
    ThermocyclerAwaitLidTemperatureCommandId,
    ThermocyclerSetTargetLidCommandId,
    ThermocyclerSetTargetBlockCommandId
]

TemperatureModuleCommand = Union[
    TemperatureModuleAwaitCommand, TemperatureModuleSetTargetCommand,
    TemperatureModuleDeactivateCommand
]
TemperatureModuleCommandId = Union[
    TemperatureModuleAwaitCommandId, TemperatureModuleSetTargetCommandId,
    TemperatureModuleDeactivateCommandId
]

MagneticModuleCommand = Union[
    MagneticModuleEngageCommand, MagneticModuleDisengageCommand
]
MagneticModuleCommandId = Union[
    MagneticModuleEngageCommandId, MagneticModuleDisengageCommandId
]


ModuleCommand = Union[ThermocyclerCommand,
                      TemperatureModuleCommand,
                      MagneticModuleCommand]
ModuleCommandId = Union[ThermocyclerCommandId,
                        TemperatureModuleCommandId,
                        MagneticModuleCommandId]

PipetteCommand = Union[AspirateCommand, DispenseCommand, AirGapCommand,
                       BlowoutCommand,  TouchTipCommand, PickUpTipCommand,
                       DropTipCommand, MoveToSlotCommand]
PipetteCommandId = Union[AspirateCommandId, DispenseCommandId, AirGapCommandId,
                         BlowoutCommandId, TouchTipCommandId,
                         PickUpTipCommandId, DropTipCommandId,
                         MoveToSlotCommandId]

RobotCommand = Union[DelayCommand]
RobotCommandId = Union[DelayCommandId]

Command = Union[ModuleCommand, PipetteCommand, RobotCommand]
CommandId = Union[ModuleCommandId, PipetteCommandId, RobotCommandId]

V3Command = Union[PipetteCommand, RobotCommand]
V3CommandId = Union[PipetteCommandId, RobotCommandId]


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


class JsonProtocolV3(TypedDict, total=False):
    schemaVersion: Literal[3]
    metadata: Metadata
    robot: RobotRequirement
    pipettes: Dict[str, PipetteRequirement]
    labware: Dict[str, LabwareRequirement]
    labwareDefinitions: Dict[str, LabwareDefinition]
    commands: List[V3Command]
    commandAnnotations: Dict[str, Any]
    designerApplication: DesignerApplication


JsonProtocol = Union[JsonProtocolV4, JsonProtocolV3]
