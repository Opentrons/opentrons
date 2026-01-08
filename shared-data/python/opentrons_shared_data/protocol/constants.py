from enum import Enum
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .types import (
        AirGapCommandId,
        AspirateCommandId,
        BlowoutCommandId,
        DelayCommandId,
        DispenseCommandId,
        DropTipCommandId,
        MagneticModuleDisengageCommandId,
        MagneticModuleEngageCommandId,
        MoveToSlotCommandId,
        MoveToWellCommandId,
        PickUpTipCommandId,
        TemperatureModuleAwaitCommandId,
        TemperatureModuleDeactivateCommandId,
        TemperatureModuleSetTargetCommandId,
        ThermocyclerAwaitBlockTemperatureCommandId,
        ThermocyclerAwaitLidTemperatureCommandId,
        ThermocyclerAwaitProfileCommandId,
        ThermocyclerCloseLidCommandId,
        ThermocyclerDeactivateBlockCommandId,
        ThermocyclerDeactivateLidCommandId,
        ThermocyclerOpenLidCommandId,
        ThermocyclerRunProfileCommandId,
        ThermocyclerSetTargetBlockCommandId,
        ThermocyclerSetTargetLidCommandId,
        TouchTipCommandId,
    )


class JsonPipetteCommand(Enum):
    airGap = "airGap"
    blowout = "blowout"
    pickUpTip = "pickUpTip"
    dropTip = "dropTip"
    aspirate = "aspirate"
    dispense = "dispense"
    touchTip = "touchTip"
    moveToSlot = "moveToSlot"
    moveToWell = "moveToWell"


class JsonRobotCommand(Enum):
    delay = "delay"


class JsonMagneticModuleCommand(Enum):
    magneticModuleEngageMagnet = "magneticModule/engageMagnet"
    magneticModuleDisengageMagnet = "magneticModule/disengageMagnet"


class JsonTemperatureModuleCommand(Enum):
    temperatureModuleSetTargetTemperature = "temperatureModule/setTargetTemperature"
    temperatureModuleDeactivate = "temperatureModule/deactivate"
    temperatureModuleAwaitTemperature = "temperatureModule/awaitTemperature"


class JsonThermocyclerCommand(Enum):
    thermocyclerSetTargetBlockTemperature = "thermocycler/setTargetBlockTemperature"
    thermocyclerSetTargetLidTemperature = "thermocycler/setTargetLidTemperature"
    thermocyclerAwaitBlockTemperature = "thermocycler/awaitBlockTemperature"
    thermocyclerAwaitLidTemperature = "thermocycler/awaitLidTemperature"
    thermocyclerOpenLid = "thermocycler/openLid"
    thermocyclerCloseLid = "thermocycler/closeLid"
    thermocyclerDeactivateBlock = "thermocycler/deactivateBlock"
    thermocyclerDeactivateLid = "thermocycler/deactivateLid"
    thermocyclerRunProfile = "thermocycler/runProfile"
    thermocyclerAwaitProfileComplete = "thermocycler/awaitProfileComplete"
