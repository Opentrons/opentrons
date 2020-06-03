from typing import Callable, Dict,  TYPE_CHECKING
try:
    from typing_extensions import Protocol, Literal, TypedDict
except ModuleNotFoundError:
    Protocol = None  # type: ignore

from opentrons_shared_data.protocol.dev_types import (
    DelayParams, BlowoutParams, PipetteAccessParams,
    StandardLiquidHandlingParams, MoveToSlotParams,
    TouchTipParams
)
from opentrons_shared_data.protocol.constants import JsonCommand

if TYPE_CHECKING:
    from .protocol_context import ProtocolContext
    from .instrument_context import InstrumentContext
    from .labware import Labware


# this file defines types that require dev dependencies
# and are only relevant for static typechecking.
#
#  - code should be written so that this file can fail to import
#  - or the things defined in here can be None at execution time
#  - only types that match the above criteria should be put here
#  - please include this file as close to a leaf as possible

if Protocol is not None:
    class Dictable(Protocol):
        """ A protocol defining the _asdict interface to
        classes generated from typing.NamedTuple, which cannot
        be used as a type annotation because it is a type ctor
        not a type (https://github.com/python/mypy/issues/3915)
        """
        async def _asdict(self):
            ...


JsonV3Dispatch = TypedDict(
    'JsonV3Dispatch',
{
    JsonCommand.delay.value: Callable[['ProtocolContext', DelayParams], None],
    JsonCommand.blowout.value: Callable[
        [Dict[str, 'InstrumentContext'],
         Dict[str, 'Labware'],
         'BlowoutParams'], None],
    JsonCommand.pickUpTip.value: Callable[
        [Dict[str, 'InstrumentContext'],
         Dict[str, 'Labware'],
         'PipetteAccessParams'], None],
    JsonCommand.dropTip.value: Callable[
        [Dict[str, 'InstrumentContext'],
         Dict[str, 'Labware'],
         'PipetteAccessParams'], None],
    JsonCommand.aspirate.value: Callable[
        [Dict[str, 'InstrumentContext'],
         Dict[str, 'Labware'],
         'StandardLiquidHandlingParams'], None],
    JsonCommand.dispense.value: Callable[
        [Dict[str, 'InstrumentContext'],
         Dict[str, 'Labware'],
         'StandardLiquidHandlingParams'], None],
    JsonCommand.touchTip.value: Callable[
        [Dict[str, 'InstrumentContext'],
         Dict[str, 'Labware'],
         'TouchTipParams'], None],
    JsonCommand.moveToSlot.value: Callable[
        ['ProtocolContext',
         Dict[str, 'InstrumentContext'],
         'MoveToSlotParams'], None],
    JsonCommand.airGap.value: Callable[
        [Dict[str, 'InstrumentContext'],
         Dict[str, 'Labware'],
         'StandardLiquidHandlingParams'], None],
},
    total=False)


JsonV4PipetteDispatch = JsonV3Dispatch


JsonV4MagneticModuleDispatch = TypedDict(
    'JsonV4MagneticModuleDispatch',
    {
        JsonCommand.magneticModuleEngageMagnet.value: Callable[
            ['MagneticModuleContext', 'MagneticModuleEngageParams'], None],
        JsonCommand.magneticModuleDisengageMagnet.value: Callable[
            ['MagneticModuleContext', 'ModuleIDParams'], None],
    })

JsonV4TemperatureModuleDispatch = TypedDict(
    'JsonV4TemperatureModuleDispatch',
    {
        JsonCommand.temperatureModuleSetTargetTemperature.value: Callable[
            ['TemperatureModuleContext', 'TemperatureParams'], None],
        JsonCommand.temperatureModuleDeactivate.value: Callable[
            ['TemperatureModuleContext', 'ModuleIDParams'], None],
        JsonCommand.temperatureModuleAwaitTemperature.value: Callable[
            ['TemperatureModuleContext', 'TemperatureParams'], None]
    }
)

JsonV4ThermocyclerDispatch = TypedDict(
    'JsonV4ThermocyclerDispatch',
    {
        JsonCommand.thermocyclerCloseLid.value: Callable[
            ['ThermocyclerContext', 'ModuleIDParams'], None],
        JsonCommand.thermocyclerOpenLid.value: Callable[
            ['ThermocyclerContext', 'ModuleIDParams'], None],
        JsonCommand.thermocyclerDeactivateBlock.value: Callable[
            ['ThermocyclerContext', 'ModuleIDParams'], None],
        JsonCommand.thermocyclerDeactivateLid.value: Callable[
            ['ThermoycclerContext', 'ModuleIDParams'], None],
        JsonCommand.thermocyclerSetTargetBlockTemperature.value: Callable[
            ['ThermocyclerContext', 'ThermocyclerSetTargetBlockParams'],
            None],
        JsonCommand.thermocyclerSetTargetLidTemperature.value: Callable[
            ['ThermocyclerContext', 'TemperatureParams'], None],
        JsonCommand.thermocyclerRunProfile.value: Callable[
            ['ThermocyclerContext', 'ThermocyclerRunProfileParams'], None],
        JsonCommand.thermocyclerAwaitBlockTemperature.value: Callable[
            ['ThermocyclerContext', 'TemperatureParams'], None],
        JsonCommand.thermocyclerAwaitLidTemperature.value: Callable[
            ['ThermocyclerContext', 'TemperatureParams'], None],
        JsonCommand.thermocyclerAwaitProfileComplete.value: Callable[
            ['ThermocyclerContext', 'ModuleIDParams'], None]
    }
)
