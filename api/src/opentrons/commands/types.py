from __future__ import annotations

from typing_extensions import Literal, Final, TypedDict
from typing import Optional, List, Sequence, TYPE_CHECKING, Union, Any
from opentrons.hardware_control.modules import ThermocyclerStep

if TYPE_CHECKING:
    from opentrons.protocol_api import InstrumentContext
    from opentrons.protocol_api.labware import Well

from opentrons.types import Location


# type for subscriptions
COMMAND: Final = 'command'

# Robot #

DELAY: Final = 'command.DELAY'
HOME: Final = 'command.HOME'
PAUSE: Final = 'command.PAUSE'
RESUME: Final = 'command.RESUME'
COMMENT: Final = 'command.COMMENT'

# Pipette #

ASPIRATE: Final = 'command.ASPIRATE'
DISPENSE: Final = 'command.DISPENSE'
MIX: Final = 'command.MIX'
CONSOLIDATE: Final = 'command.CONSOLIDATE'
DISTRIBUTE: Final = 'command.DISTRIBUTE'
TRANSFER: Final = 'command.TRANSFER'
PICK_UP_TIP: Final = 'command.PICK_UP_TIP'
DROP_TIP: Final = 'command.DROP_TIP'
BLOW_OUT: Final = 'command.BLOW_OUT'
AIR_GAP: Final = 'command.AIR_GAP'
TOUCH_TIP: Final = 'command.TOUCH_TIP'
RETURN_TIP: Final = 'command.RETURN_TIP'

# Modules #

MAGDECK_CALIBRATE: Final = 'command.MAGDECK_CALIBRATE'
MAGDECK_DISENGAGE: Final = 'command.MAGDECK_DISENGAGE'
MAGDECK_ENGAGE: Final = 'command.MAGDECK_ENGAGE'

TEMPDECK_DEACTIVATE: Final = 'command.TEMPDECK_DEACTIVATE'
TEMPDECK_SET_TEMP: Final = 'command.TEMPDECK_SET_TEMP'
TEMPDECK_AWAIT_TEMP: Final = 'command.TEMPDECK_AWAIT_TEMP'

THERMOCYCLER_OPEN: Final = 'command.THERMOCYCLER_OPEN'
THERMOCYCLER_CLOSE: Final = 'command.THERMOCYCLER_CLOSE'
THERMOCYCLER_SET_BLOCK_TEMP: Final = 'command.THERMOCYCLER_SET_BLOCK_TEMP'
THERMOCYCLER_EXECUTE_PROFILE: Final = 'command.THERMOCYCLER_EXECUTE_PROFILE'
THERMOCYCLER_DEACTIVATE: Final = 'command.THERMOCYCLER_DEACTIVATE'
THERMOCYCLER_WAIT_FOR_HOLD: Final = 'command.THERMOCYCLER_WAIT_FOR_HOLD'
THERMOCYCLER_WAIT_FOR_TEMP: Final = 'command.THERMOCYCLER_WAIT_FOR_TEMP'
THERMOCYCLER_WAIT_FOR_LID_TEMP: Final = 'command.THERMOCYCLER_WAIT_FOR_LID_TEMP'
THERMOCYCLER_SET_LID_TEMP: Final = 'command.THERMOCYCLER_SET_LID_TEMP'
THERMOCYCLER_DEACTIVATE_LID: Final = 'command.THERMOCYCLER_DEACTIVATE_LID'
THERMOCYCLER_DEACTIVATE_BLOCK: Final = 'command.THERMOCYCLER_DEACTIVATE_BLOCK'


class TextOnlyPayload(TypedDict):
    text: str


class SingleLocationPayload(TypedDict):
    location: Union[Location, Well]


class MultiLocationPayload(TypedDict):
    locations: Sequence[Union[Location, Well]]


class OptionalMultiLocationPayload(TypedDict):
    locations: Optional[Sequence[Union[Location, Well]]]


class OptionalSingleLocationPayload(TypedDict):
    location: Union[Location, Well, None]


HasLocationPayload = Union[
    SingleLocationPayload, MultiLocationPayload,
    OptionalSingleLocationPayload, OptionalMultiLocationPayload]


class SingleInstrumentPayload(TypedDict):
    instrument: InstrumentContext


class MultiInstrumentPayload(TypedDict):
    instruments: Sequence[InstrumentContext]


HasInstrumentPayload = Union[SingleInstrumentPayload, MultiInstrumentPayload]


class CommentCommandPayload(TextOnlyPayload):
    pass


class CommentCommand(TypedDict):
    name: Literal['command.COMMENT']
    payload: CommentCommandPayload


class DelayCommandPayload(TextOnlyPayload):
    minutes: float
    seconds: float


class DelayCommand(TypedDict):
    name: Literal['command.DELAY']
    payload: DelayCommandPayload


class PauseCommandPayload(TextOnlyPayload):
    userMessage: Optional[str]


class PauseCommand(TypedDict):
    name: Literal['command.PAUSE']
    payload: PauseCommandPayload


class ResumeCommandPayload(TextOnlyPayload):
    pass


class ResumeCommand(TypedDict):
    name: Literal['command.RESUME']
    payload: ResumeCommandPayload


class MagdeckEngageCommandPayload(TextOnlyPayload):
    pass


class MagdeckEngageCommand(TypedDict):
    name: Literal['command.MAGDECK_ENGAGE']
    payload: MagdeckEngageCommandPayload


class MagdeckDisengageCommandPayload(TextOnlyPayload):
    pass


class MagdeckDisengageCommand(TypedDict):
    name: Literal['command.MAGDECK_DISENGAGE']
    payload: MagdeckDisengageCommandPayload


class MagdeckCalibrateCommandPayload(TextOnlyPayload):
    pass


class MagdeckCalibrateCommand(TypedDict):
    name: Literal['command.MAGDECK_CALIBRATE']
    payload: MagdeckCalibrateCommandPayload


class TempdeckSetTempCommandPayload(TextOnlyPayload):
    celsius: float


class TempdeckSetTempCommand(TypedDict):
    name: Literal['command.TEMPDECK_SET_TEMP']
    payload: TempdeckSetTempCommandPayload


class TempdeckAwaitTempCommandPayload(TextOnlyPayload):
    celsius: float


class TempdeckAwaitTempCommand(TypedDict):
    name: Literal['command.TEMPDECK_AWAIT_TEMP']
    payload: TempdeckAwaitTempCommandPayload


class TempdeckDeactivateCommandPayload(TextOnlyPayload):
    pass


class TempdeckDeactivateCommand(TypedDict):
    name: Literal['command.TEMPDECK_DEACTIVATE']
    payload: TempdeckDeactivateCommandPayload


class ThermocyclerOpenCommandPayload(TextOnlyPayload):
    pass


class ThermocyclerOpenCommand(TypedDict):
    name: Literal['command.THERMOCYCLER_OPEN']
    payload: ThermocyclerOpenCommandPayload


class ThermocyclerSetBlockTempCommandPayload(TextOnlyPayload):
    temperature: float
    hold_time: Optional[float]


class ThermocyclerSetBlockTempCommand(TypedDict):
    name: Literal['command.THERMOCYCLER_SET_BLOCK_TEMP']
    payload: ThermocyclerSetBlockTempCommandPayload


class ThermocyclerExecuteProfileCommandPayload(TextOnlyPayload):
    steps: List[ThermocyclerStep]


class ThermocyclerExecuteProfileCommand(TypedDict):
    name: Literal['command.THERMOCYCLER_EXECUTE_PROFILE']
    payload: ThermocyclerExecuteProfileCommandPayload


class ThermocyclerWaitForHoldCommandPayload(TextOnlyPayload):
    pass


class ThermocyclerWaitForHoldCommand(TypedDict):
    name: Literal['command.THERMOCYCLER_WAIT_FOR_HOLD']
    payload: ThermocyclerWaitForHoldCommandPayload


class ThermocyclerWaitForTempCommandPayload(TextOnlyPayload):
    pass


class ThermocyclerWaitForTempCommand(TypedDict):
    name: Literal['command.THERMOCYCLER_WAIT_FOR_TEMP']
    payload: ThermocyclerWaitForTempCommandPayload


class ThermocyclerSetLidTempCommandPayload(TextOnlyPayload):
    pass


class ThermocyclerSetLidTempCommand(TypedDict):
    name: Literal['command.THERMOCYCLER_SET_LID_TEMP']
    payload: ThermocyclerSetLidTempCommandPayload


class ThermocyclerDeactivateLidCommandPayload(TextOnlyPayload):
    pass


class ThermocyclerDeactivateLidCommand(TypedDict):
    name: Literal['command.THERMOCYCLER_DEACTIVATE_LID']
    payload: ThermocyclerDeactivateLidCommandPayload


class ThermocyclerDeactivateBlockCommandPayload(TextOnlyPayload):
    pass


class ThermocyclerDeactivateBlockCommand(TypedDict):
    name: Literal['command.THERMOCYCLER_DEACTIVATE_BLOCK']
    payload: ThermocyclerDeactivateBlockCommandPayload


class ThermocyclerDeactivateCommandPayload(TextOnlyPayload):
    pass


class ThermocyclerDeactivateCommand(TypedDict):
    name: Literal['command.THERMOCYCLER_DEACTIVATE']
    payload: ThermocyclerDeactivateCommandPayload


class ThermocyclerWaitForLidTempCommandPayload(TextOnlyPayload):
    pass


class ThermocyclerWaitForLidTempCommand(TypedDict):
    name: Literal['command.THERMOCYCLER_WAIT_FOR_LID_TEMP']
    payload: ThermocyclerWaitForLidTempCommandPayload


class ThermocyclerCloseCommandPayload(TextOnlyPayload):
    pass


class ThermocyclerCloseCommand(TypedDict):
    name: Literal['command.THERMOCYCLER_CLOSE']
    payload: ThermocyclerCloseCommandPayload


class HomeCommandPayload(TextOnlyPayload):
    axis: str


class HomeCommand(TypedDict):
    name: Literal['command.HOME']
    payload: HomeCommandPayload


class SimpleLHCommandPayload(
        TextOnlyPayload, SingleLocationPayload, SingleInstrumentPayload):
    volume: float
    rate: float


class SimplePairedLHCommandPayload(
        TextOnlyPayload, MultiLocationPayload, MultiInstrumentPayload):
    volume: float
    rate: float


class AspirateCommand(TypedDict):
    name: Literal['command.ASPIRATE']
    payload: Union[SimpleLHCommandPayload, SimplePairedLHCommandPayload]


class DispenseCommand(TypedDict):
    name: Literal['command.DISPENSE']
    payload: Union[SimpleLHCommandPayload, SimplePairedLHCommandPayload]


class ConsolidateCommandPayload(
        TextOnlyPayload, MultiLocationPayload, SingleInstrumentPayload):
    volume: Union[float, List[float]]
    source: List[Union[Location, Well]]
    dest: Union[Location, Well]


class ConsolidateCommand(TypedDict):
    name: Literal['command.CONSOLIDATE']
    payload: ConsolidateCommandPayload


class DistributeCommandPayload(
        TextOnlyPayload, MultiLocationPayload, SingleInstrumentPayload):
    volume: Union[float, List[float]]
    source: Union[Location, Well]
    dest: List[Union[Location, Well]]


class DistributeCommand(TypedDict):
    name: Literal['command.DISTRIBUTE']
    payload: DistributeCommandPayload


class TransferCommandPayload(
        TextOnlyPayload, MultiLocationPayload, SingleInstrumentPayload):
    volume: Union[float, List[float]]
    source: List[Union[Location, Well]]
    dest: List[Union[Location, Well]]


class TransferCommand(TypedDict):
    name: Literal['command.TRANSFER']
    payload: TransferCommandPayload


class MixCommandPayload(
        TextOnlyPayload, OptionalSingleLocationPayload, SingleInstrumentPayload):
    volume: float
    repetitions: int


class PairedMixCommandPayload(
        TextOnlyPayload, OptionalMultiLocationPayload, MultiInstrumentPayload):
    volume: float
    repetitions: int


class MixCommand(TypedDict):
    name: Literal['command.MIX']
    payload: Union[MixCommandPayload, PairedMixCommandPayload]


class BlowOutCommandPayload(
        TextOnlyPayload, OptionalSingleLocationPayload, SingleInstrumentPayload):
    pass


class PairedBlowOutCommandPayload(
        TextOnlyPayload, OptionalMultiLocationPayload, MultiInstrumentPayload):
    pass


class BlowOutCommand(TypedDict):
    name: Literal['command.BLOW_OUT']
    payload: Union[BlowOutCommandPayload, PairedBlowOutCommandPayload]


class TouchTipCommandPayload(
        TextOnlyPayload, SingleInstrumentPayload):
    pass


class PairedTouchTipCommandPayload(
        TextOnlyPayload, OptionalMultiLocationPayload, MultiInstrumentPayload):
    pass


class TouchTipCommand(TypedDict):
    name: Literal['command.TOUCH_TIP']
    payload: Union[TouchTipCommandPayload, PairedTouchTipCommandPayload]


class AirGapCommandPayload(TextOnlyPayload):
    pass


class AirGapCommand(TypedDict):
    name: Literal['command.AIR_GAP']
    payload: AirGapCommandPayload


class ReturnTipCommandPayload(TextOnlyPayload):
    pass


class ReturnTipCommand(TypedDict):
    name: Literal['command.RETURN_TIP']
    payload: ReturnTipCommandPayload


class PickUpTipCommandPayload(
        TextOnlyPayload, SingleLocationPayload, SingleInstrumentPayload):
    pass


class PairedPickUpTipCommandPayload(
        TextOnlyPayload, MultiLocationPayload, MultiInstrumentPayload):
    pass


class PickUpTipCommand(TypedDict):
    name: Literal['command.PICK_UP_TIP']
    payload: Union[PickUpTipCommandPayload, PairedPickUpTipCommandPayload]
    pass


class DropTipCommandPayload(
        TextOnlyPayload, SingleLocationPayload, SingleInstrumentPayload):
    pass


class PairedDropTipCommandPayload(
        TextOnlyPayload, MultiLocationPayload, MultiInstrumentPayload):
    pass


class DropTipCommand(TypedDict):
    name: Literal['command.DROP_TIP']
    payload: Union[DropTipCommandPayload, PairedDropTipCommandPayload]


Command = Union[
    DropTipCommand, PickUpTipCommand, ReturnTipCommand, AirGapCommand,
    TouchTipCommand, BlowOutCommand, MixCommand, TransferCommand,
    DistributeCommand, ConsolidateCommand, DispenseCommand, AspirateCommand,
    HomeCommand, ThermocyclerCloseCommand, ThermocyclerWaitForLidTempCommand,
    ThermocyclerDeactivateCommand, ThermocyclerDeactivateBlockCommand,
    ThermocyclerDeactivateLidCommand, ThermocyclerSetLidTempCommand,
    ThermocyclerWaitForTempCommand, ThermocyclerWaitForHoldCommand,
    ThermocyclerExecuteProfileCommand, ThermocyclerSetBlockTempCommand,
    ThermocyclerOpenCommand,
    TempdeckDeactivateCommand, TempdeckAwaitTempCommand,
    TempdeckSetTempCommand, MagdeckCalibrateCommand, MagdeckDisengageCommand,
    MagdeckEngageCommand, ResumeCommand, PauseCommand, DelayCommand,
    CommentCommand]


CommandPayload = Union[
    CommentCommandPayload, ResumeCommandPayload,
    MagdeckEngageCommandPayload, MagdeckDisengageCommandPayload,
    MagdeckCalibrateCommandPayload,
    ThermocyclerOpenCommandPayload,
    ThermocyclerWaitForHoldCommandPayload,
    ThermocyclerWaitForTempCommandPayload,
    ThermocyclerSetLidTempCommandPayload,
    ThermocyclerDeactivateLidCommandPayload,
    ThermocyclerDeactivateBlockCommandPayload,
    ThermocyclerDeactivateCommandPayload,
    ThermocyclerWaitForLidTempCommand,
    ThermocyclerCloseCommandPayload,
    AirGapCommandPayload, ReturnTipCommandPayload,
    DropTipCommandPayload, PairedDropTipCommandPayload,
    PickUpTipCommandPayload, PairedPickUpTipCommandPayload,
    TouchTipCommandPayload, PairedTouchTipCommandPayload,
    BlowOutCommandPayload, PairedBlowOutCommandPayload,
    MixCommandPayload, PairedMixCommandPayload,
    TransferCommandPayload, DistributeCommandPayload, ConsolidateCommandPayload,
    SimpleLHCommandPayload, SimplePairedLHCommandPayload,
    HomeCommandPayload,
    ThermocyclerExecuteProfileCommandPayload,
    ThermocyclerSetBlockTempCommandPayload,
    TempdeckAwaitTempCommandPayload,
    TempdeckSetTempCommandPayload,
    PauseCommandPayload, DelayCommandPayload
]


MessageSequenceId = Union[Literal['before'], Literal['after']]


CommandMessageSequence = TypedDict('CommandMessageSequence',

                                   {'$': MessageSequenceId})
CommandMessageMeta = TypedDict('CommandMessageMeta',
                               {'meta': Any}, total=False)


class CommandMessageFields(CommandMessageMeta, CommandMessageSequence):
    pass


class DropTipMessage(CommandMessageFields, DropTipCommand):
    pass


class PickUpTipMessage(CommandMessageFields, PickUpTipCommand):
    pass


class ReturnTipMessage(CommandMessageFields, ReturnTipCommand):
    pass


class AirGapMessage(CommandMessageFields, AirGapCommand):
    pass


class TouchTipMessage(CommandMessageFields, TouchTipCommand):
    pass


class BlowOutMessage(CommandMessageFields, BlowOutCommand):
    pass


class MixMessage(CommandMessageFields, MixCommand):
    pass


class TransferMessage(CommandMessageFields, TransferCommand):
    pass


class DistributeMessage(CommandMessageFields, DistributeCommand):
    pass


class ConsolidateMessage(CommandMessageFields, ConsolidateCommand):
    pass


class DispenseMessage(CommandMessageFields, DispenseCommand):
    pass


class AspirateMessage(CommandMessageFields, AspirateCommand):
    pass


class HomeMessage(CommandMessageFields, HomeCommand):
    pass


class ThermocyclerCloseMessage(
        CommandMessageFields, ThermocyclerCloseCommand):
    pass


class ThermocyclerWaitForLidTempMessage(
        CommandMessageFields, ThermocyclerWaitForLidTempCommand):
    pass


class ThermocyclerDeactivateMessage(
        CommandMessageFields, ThermocyclerDeactivateCommand):
    pass


class ThermocyclerDeactivateBlockMessage(
        CommandMessageFields, ThermocyclerDeactivateBlockCommand):
    pass


class ThermocyclerDeactivateLidMessage(
        CommandMessageFields, ThermocyclerDeactivateLidCommand):
    pass


class ThermocyclerSetLidTempMessage(
        CommandMessageFields, ThermocyclerSetLidTempCommand):
    pass


class ThermocyclerWaitForTempMessage(
        CommandMessageFields, ThermocyclerWaitForTempCommand):
    pass


class ThermocyclerWaitForHoldMessage(
        CommandMessageFields, ThermocyclerWaitForHoldCommand):
    pass


class ThermocyclerExecuteProfileMessage(
        CommandMessageFields, ThermocyclerExecuteProfileCommand):
    pass


class ThermocyclerSetBlockTempMessage(
        CommandMessageFields, ThermocyclerSetBlockTempCommand):
    pass


class ThermocyclerOpenMessage(
        CommandMessageFields, ThermocyclerOpenCommand):
    pass


class TempdeckDeactivateMessage(
        CommandMessageFields, TempdeckDeactivateCommand):
    pass


class TempdeckAwaitTempMessage(
        CommandMessageFields, TempdeckAwaitTempCommand):
    pass


class TempdeckSetTempMessage(
        CommandMessageFields, TempdeckSetTempCommand):
    pass


class MagdeckCalibrateMessage(
        CommandMessageFields, MagdeckCalibrateCommand):
    pass


class MagdeckDisengageMessage(
        CommandMessageFields, MagdeckDisengageCommand):
    pass


class MagdeckEngageMessage(CommandMessageFields, MagdeckEngageCommand):
    pass


class ResumeMessage(CommandMessageFields, ResumeCommand):
    pass


class PauseMessage(CommandMessageFields, PauseCommand):
    pass


class DelayMessage(CommandMessageFields, DelayCommand):
    pass


class CommentMessage(CommandMessageFields, CommentCommand):
    pass


CommandMessage = Union[
    DropTipMessage, PickUpTipMessage, ReturnTipMessage, AirGapMessage,
    TouchTipMessage, BlowOutMessage, MixMessage, TransferMessage,
    DistributeMessage, ConsolidateMessage, DispenseMessage, AspirateMessage,
    HomeMessage, ThermocyclerCloseMessage, ThermocyclerWaitForLidTempMessage,
    ThermocyclerDeactivateMessage, ThermocyclerDeactivateBlockMessage,
    ThermocyclerDeactivateLidMessage, ThermocyclerSetLidTempMessage,
    ThermocyclerWaitForTempMessage, ThermocyclerWaitForHoldMessage,
    ThermocyclerExecuteProfileMessage, ThermocyclerSetBlockTempMessage,
    ThermocyclerOpenMessage, TempdeckSetTempMessage, TempdeckDeactivateMessage,
    MagdeckEngageMessage, MagdeckDisengageMessage, MagdeckCalibrateMessage,
    CommentMessage, DelayMessage, PauseMessage, ResumeMessage]
