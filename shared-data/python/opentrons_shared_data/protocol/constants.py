from typing import TYPE_CHECKING
from enum import Enum


if TYPE_CHECKING:
    from .dev_types import (
        DelayCommandId, BlowoutCommandId, PickUpTipCommandId,
        DropTipCommandId, AspirateCommandId, DispenseCommandId,
        TouchTipCommandId, MoveToSlotCommandId, AirGapCommandId,
        MagneticModuleEngageCommandId, MagneticModuleDisengageCommandId,
        TemperatureModuleSetTargetCommandId,
        TemperatureModuleAwaitCommandId,
        TemperatureModuleDeactivateCommandId,
        ThermocyclerSetTargetBlockCommandId,
        ThermocyclerSetTargetLidCommandId,
        ThermocyclerAwaitBlockTemperatureCommandId,
        ThermocyclerAwaitLidTemperatureCommandId,
        ThermocyclerOpenLidCommandId, ThermocyclerCloseLidCommandId,
        ThermocyclerDeactivateLidCommandId,
        ThermocyclerDeactivateBlockCommandId,
        ThermocyclerRunProfileCommandId,
        ThermocyclerAwaitProfileCommandId
    )


class JsonPipetteCommand(Enum):
    airGap: 'AirGapCommandId' = 'airGap'
    blowout: 'BlowoutCommandId' = "blowout"
    pickUpTip: 'PickUpTipCommandId' = "pickUpTip"
    dropTip: 'DropTipCommandId' = "dropTip"
    aspirate: 'AspirateCommandId' = "aspirate"
    dispense: 'DispenseCommandId' = "dispense"
    touchTip: 'TouchTipCommandId' = "touchTip"
    moveToSlot: 'MoveToSlotCommandId' = "moveToSlot"


class JsonRobotCommand(Enum):
    delay: 'DelayCommandId' = "delay"


class JsonMagneticModuleCommand(Enum):
    magneticModuleEngageMagnet: 'MagneticModuleEngageCommandId'\
        = "magneticModule/engageMagnet"
    magneticModuleDisengageMagnet: 'MagneticModuleDisengageCommandId'\
        = "magneticModule/disengageMagnet"


class JsonTemperatureModuleCommand(Enum):
    temperatureModuleSetTargetTemperature:\
        'TemperatureModuleSetTargetCommandId'\
        = "temperatureModule/setTargetTemperature"
    temperatureModuleDeactivate: 'TemperatureModuleDeactivateCommandId'\
        = "temperatureModule/deactivate"
    temperatureModuleAwaitTemperature: 'TemperatureModuleAwaitCommandId'\
        = "temperatureModule/awaitTemperature"


class JsonThermocyclerCommand(Enum):
    thermocyclerSetTargetBlockTemperature:\
        'ThermocyclerSetTargetBlockCommandId'\
        = "thermocycler/setTargetBlockTemperature"
    thermocyclerSetTargetLidTemperature: 'ThermocyclerSetTargetLidCommandId' \
        = "thermocycler/setTargetLidTemperature"
    thermocyclerAwaitBlockTemperature:\
        'ThermocyclerAwaitBlockTemperatureCommandId'\
        = "thermocycler/awaitBlockTemperature"
    thermocyclerAwaitLidTemperature:\
        'ThermocyclerAwaitLidTemperatureCommandId'\
        = "thermocycler/awaitLidTemperature"
    thermocyclerOpenLid: 'ThermocyclerOpenLidCommandId'\
        = "thermocycler/openLid"
    thermocyclerCloseLid: 'ThermocyclerCloseLidCommandId'\
        = "thermocycler/closeLid"
    thermocyclerDeactivateBlock: 'ThermocyclerDeactivateBlockCommandId'\
        = "thermocycler/deactivateBlock"
    thermocyclerDeactivateLid: 'ThermocyclerDeactivateLidCommandId'\
        = "thermocycler/deactivateLid"
    thermocyclerRunProfile: 'ThermocyclerRunProfileCommandId'\
        = "thermocycler/runProfile"
    thermocyclerAwaitProfileComplete: 'ThermocyclerAwaitProfileCommandId'\
        = 'thermocycler/awaitProfileComplete'
