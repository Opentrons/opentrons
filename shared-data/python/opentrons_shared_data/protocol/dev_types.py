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


AspirateCommandId = Literal['aspirate']
class AspirateCommand(TypedDict):
    command: AspirateCommandId
    params: StandardLiquidHandlingParams


DispenseCommandId = Literal['dispense']
class DispenseCommand(TypedDict):
    command: DispenseCommandId
    params: StandardLiquidHandlingParams


AirGapCommandId = Literal['airGap']
class AirGapCommand(TypedDict):
    command: AirGapCommandId
    params: StandardLiquidHandlingParams


class BlowoutParams(PipetteAccessWithOffsetParams, FlowRateParams):
    pass


BlowoutCommandId = Literal['blowout']
class BlowoutCommand(TypedDict):
    command: BlowoutCommandId
    params: BlowoutParams


class TouchTipParams(PipetteAccessParams):
    offsetFromBottomMm: float


TouchTipCommandId = Literal['touchTip']
class TouchTipCommand(TypedDict):
    command: TouchTipCommandId
    params: TouchTipParams


PickUpTipCommandId = Literal['pickUpTip']
class PickUpTipCommand(TypedDict):
    command: PickUpTipCommandId
    params: PipetteAccessParams


DropTipCommandId = Literal['dropTip']
class DropTipCommand(TypedDict):
    command: DropTipCommandId
    params: PipetteAccessParams


class MoveToSlotParams(TypedDict, total=False):
    pipette: str
    slot: str
    offset: NamedOffset
    minimumZHeight: float
    forceDirect: bool


MoveToSlotCommandId = Literal['moveToSlot']
class MoveToSlotCommand(TypedDict):
    command: MoveToSlotCommandId
    params: MoveToSlotParams


class DelayParams(TypedDict, total=False):
    wait: Union[float, bool]
    message: str


DelayCommandId = Literal['delay']
class DelayCommand(TypedDict):
    command: DelayCommandId
    params: DelayParams


class ModuleIDParams(TypedDict):
    module: str


class MagneticModuleEngageParams(ModuleIDParams):
    engageHeight: float


MagneticModuleEngageCommandId = Literal['magneticModule/engageMagnet']
class MagneticModuleEngageCommand(TypedDict):
    command: MagneticModuleEngageCommandId
    params: MagneticModuleEngageParams


MagneticModuleDisengageCommandId = Literal['magneticModule/disengageMagnet']
class MagneticModuleDisengageCommand(TypedDict):
    command: MagneticModuleDisengageCommandId
    params: ModuleIDParams


class TemperatureParams(ModuleIDParams):
    temperature: float


TemperatureModuleSetTargetCommandId\
    = Literal['temperatureModule/setTargetTemperature']
class TemperatureModuleSetTargetCommand(TypedDict):
    command: TemperatureModuleSetTargetCommandId
    params: TemperatureParams


TemperatureModuleAwaitCommandId = Literal['temperatureModule/awaitTemperature']
class TemperatureModuleAwaitCommand(TypedDict):
    command: TemperatureModuleAwaitCommandId
    params: TemperatureParams


TemperatureModuleDeactivateCommandId = Literal['temperatureModule/deactivate']
class TemperatureModuleDeactivateCommand(TypedDict):
    command: TemperatureModuleDeactivateCommandId
    params: ModuleIDParams


class ThermocyclerSetTargetBlockParams(TemperatureParams):
    volume: float


ThermocyclerSetTargetBlockCommandId\
    = Literal['thermocycler/setTargetBlockTemperature']
class ThermocyclerSetTargetBlockCommand(TypedDict):
    command: ThermocyclerSetTargetBlockCommandId
    params: ThermocyclerSetTargetBlockParams


ThermocyclerSetTargetLidCommandId\
    = Literal['thermocycler/setTargetLidTemperature']
class ThermocyclerSetTargetLidCommand(TypedDict):
    command: ThermocyclerSetTargetLidCommandId
    params: TemperatureParams


ThermocyclerAwaitLidTemperatureCommandId \
    = Literal['thermocycler/awaitLidTemperature']
class ThermocyclerAwaitLidTemperatureCommand(TypedDict):
    command: ThermocyclerAwaitLidTemperatureCommandId
    params: TemperatureParams


ThermocyclerAwaitBlockTemperatureCommandId \
    = Literal['thermocycler/awaitBlockTemperature']
class ThermocyclerAwaitBlockTemperatureCommand(TypedDict):
    command: ThermocyclerAwaitBlockTemperatureCommandId
    params: TemperatureParams


ThermocyclerDeactivateBlockCommandId = Literal['thermocycler/deactivateBlock']
class ThermocyclerDeactivateBlockCommand(TypedDict):
    command: ThermocyclerDeactivateBlockCommandId
    params: ModuleIDParams


ThermocyclerDeactivateLidCommandId = Literal['thermocycler/deactivateLid']
class ThermocyclerDeactivateLidCommand(TypedDict):
    command: ThermocyclerDeactivateLidCommandId
    params: ModuleIDParams


ThermocyclerOpenLidCommandId = Literal['thermocycler/openLid']
class ThermocyclerOpenLidCommand(TypedDict):
    command: ThermocyclerOpenLidCommandId
    params: ModuleIDParams


ThermocyclerCloseLidCommandId = Literal['thermocycler/closeLid']
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


ThermocyclerRunProfileCommandId = Literal['thermocycler/runProfile']
class ThermocyclerRunProfileCommand(TypedDict):
    command: ThermocyclerRunProfileCommandId
    params: ThermocyclerRunProfileParams


ThermocyclerAwaitProfileCommandId\
    = Literal['thermocycler/awaitProfileComplete']
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
