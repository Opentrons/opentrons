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
    airGap: "AirGapCommandId" = "airGap"
    blowout: "BlowoutCommandId" = "blowout"
    pickUpTip: "PickUpTipCommandId" = "pickUpTip"
    dropTip: "DropTipCommandId" = "dropTip"
    aspirate: "AspirateCommandId" = "aspirate"
    dispense: "DispenseCommandId" = "dispense"
    touchTip: "TouchTipCommandId" = "touchTip"
    moveToSlot: "MoveToSlotCommandId" = "moveToSlot"
    moveToWell: "MoveToWellCommandId" = "moveToWell"


class JsonRobotCommand(Enum):
    delay: "DelayCommandId" = "delay"


class JsonMagneticModuleCommand(Enum):
    magneticModuleEngageMagnet: "MagneticModuleEngageCommandId" = (
        "magneticModule/engageMagnet"
    )
    magneticModuleDisengageMagnet: "MagneticModuleDisengageCommandId" = (
        "magneticModule/disengageMagnet"
    )


class JsonTemperatureModuleCommand(Enum):
    temperatureModuleSetTargetTemperature: "TemperatureModuleSetTargetCommandId" = (
        "temperatureModule/setTargetTemperature"
    )
    temperatureModuleDeactivate: "TemperatureModuleDeactivateCommandId" = (
        "temperatureModule/deactivate"
    )
    temperatureModuleAwaitTemperature: "TemperatureModuleAwaitCommandId" = (
        "temperatureModule/awaitTemperature"
    )


class JsonThermocyclerCommand(Enum):
    thermocyclerSetTargetBlockTemperature: "ThermocyclerSetTargetBlockCommandId" = (
        "thermocycler/setTargetBlockTemperature"
    )
    thermocyclerSetTargetLidTemperature: "ThermocyclerSetTargetLidCommandId" = (
        "thermocycler/setTargetLidTemperature"
    )
    thermocyclerAwaitBlockTemperature: "ThermocyclerAwaitBlockTemperatureCommandId" = (
        "thermocycler/awaitBlockTemperature"
    )
    thermocyclerAwaitLidTemperature: "ThermocyclerAwaitLidTemperatureCommandId" = (
        "thermocycler/awaitLidTemperature"
    )
    thermocyclerOpenLid: "ThermocyclerOpenLidCommandId" = "thermocycler/openLid"
    thermocyclerCloseLid: "ThermocyclerCloseLidCommandId" = "thermocycler/closeLid"
    thermocyclerDeactivateBlock: "ThermocyclerDeactivateBlockCommandId" = (
        "thermocycler/deactivateBlock"
    )
    thermocyclerDeactivateLid: "ThermocyclerDeactivateLidCommandId" = (
        "thermocycler/deactivateLid"
    )
    thermocyclerRunProfile: "ThermocyclerRunProfileCommandId" = (
        "thermocycler/runProfile"
    )
    thermocyclerAwaitProfileComplete: "ThermocyclerAwaitProfileCommandId" = (
        "thermocycler/awaitProfileComplete"
    )
