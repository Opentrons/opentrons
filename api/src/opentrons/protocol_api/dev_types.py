from typing import Callable, Dict, TYPE_CHECKING

from typing_extensions import Protocol, TypedDict

from opentrons_shared_data.protocol.dev_types import (
    BlowoutParams, DelayParams, PipetteAccessParams,
    StandardLiquidHandlingParams, TouchTipParams, MoveToSlotParams,
    TemperatureParams, ModuleIDParams, MagneticModuleEngageParams,
    ThermocyclerRunProfileParams, ThermocyclerSetTargetBlockParams,
    MoveToWellParams
)

if TYPE_CHECKING:
    from .protocol_context import ProtocolContext
    from .instrument_context import InstrumentContext
    from .module_contexts import (
        MagneticModuleContext, ThermocyclerContext, TemperatureModuleContext)
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


# using a lot of string literals here instead of the enum values from
# opentrons_shared_data.protocol.constants because of
# https://github.com/python/mypy/issues/4128
PipetteDispatch = TypedDict(
    'PipetteDispatch',
    {
        'delay': Callable[['ProtocolContext', 'DelayParams'], None],
        'blowout': Callable[
            [Dict[str, 'InstrumentContext'],
             Dict[str, 'Labware'],
             'BlowoutParams'], None],
        'pickUpTip': Callable[
            [Dict[str, 'InstrumentContext'],
             Dict[str, 'Labware'],
             'PipetteAccessParams'], None],
        'dropTip': Callable[
            [Dict[str, 'InstrumentContext'],
             Dict[str, 'Labware'],
             'PipetteAccessParams'], None],
        'aspirate': Callable[
            [Dict[str, 'InstrumentContext'],
             Dict[str, 'Labware'],
             'StandardLiquidHandlingParams'], None],
        'dispense': Callable[
            [Dict[str, 'InstrumentContext'],
             Dict[str, 'Labware'],
             'StandardLiquidHandlingParams'], None],
        'touchTip': Callable[
            [Dict[str, 'InstrumentContext'],
             Dict[str, 'Labware'],
             'TouchTipParams'], None],
        'moveToSlot': Callable[
            ['ProtocolContext',
             Dict[str, 'InstrumentContext'],
             'MoveToSlotParams'], None],
        'moveToWell': Callable[
            [Dict[str, 'InstrumentContext'],
             Dict[str, 'Labware'],
             'MoveToWellParams'], None],
        'airGap': Callable[
            [Dict[str, 'InstrumentContext'],
             Dict[str, 'Labware'],
             'StandardLiquidHandlingParams'], None],
    },
    total=False)


JsonV4MagneticModuleDispatch = TypedDict(
    'JsonV4MagneticModuleDispatch',
    {
        'magneticModule/engageMagnet': Callable[
            ['MagneticModuleContext', 'MagneticModuleEngageParams'], None],
        'magneticModule/disengageMagnet': Callable[
            ['MagneticModuleContext', 'ModuleIDParams'], None],
    })

JsonV4TemperatureModuleDispatch = TypedDict(
    'JsonV4TemperatureModuleDispatch',
    {
        'temperatureModule/setTargetTemperature': Callable[
            ['TemperatureModuleContext', 'TemperatureParams'], None],
        'temperatureModule/deactivate': Callable[
            ['TemperatureModuleContext', 'ModuleIDParams'], None],
        'temperatureModule/awaitTemperature': Callable[
            ['TemperatureModuleContext', 'TemperatureParams'], None]
    }
)

JsonV4ThermocyclerDispatch = TypedDict(
    'JsonV4ThermocyclerDispatch',
    {
        'thermocycler/closeLid': Callable[
            ['ThermocyclerContext', 'ModuleIDParams'], None],
        'thermocycler/openLid': Callable[
            ['ThermocyclerContext', 'ModuleIDParams'], None],
        'thermocycler/deactivateBlock': Callable[
            ['ThermocyclerContext', 'ModuleIDParams'], None],
        'thermocycler/deactivateLid': Callable[
            ['ThermocyclerContext', 'ModuleIDParams'], None],
        'thermocycler/setTargetBlockTemperature': Callable[
            ['ThermocyclerContext', 'ThermocyclerSetTargetBlockParams'],
            None],
        'thermocycler/setTargetLidTemperature': Callable[
            ['ThermocyclerContext', 'TemperatureParams'], None],
        'thermocycler/runProfile': Callable[
            ['ThermocyclerContext', 'ThermocyclerRunProfileParams'], None],
        'thermocycler/awaitBlockTemperature': Callable[
            ['ThermocyclerContext', 'TemperatureParams'], None],
        'thermocycler/awaitLidTemperature': Callable[
            ['ThermocyclerContext', 'TemperatureParams'], None],
        'thermocycler/awaitProfileComplete': Callable[
            ['ThermocyclerContext', 'ModuleIDParams'], None]
    }
)
