import enum


class JsonCommand(enum.Enum):
    delay = "delay"
    blowout = "blowout"
    pickUpTip = "pickUpTip"
    dropTip = "dropTip"
    aspirate = "aspirate"
    dispense = "dispense"
    touchTip = "touchTip"
    moveToSlot = "moveToSlot"
    magneticModuleEngageMagnet = "magneticModule/engageMagnet"
    magneticModuleDisengageMagnet = "magneticModule/disengageMagnet"
    temperatureModuleSetTargetTemperature = \
        "temperatureModule/setTargetTemperature"
    temperatureModuleDeactivate = \
        "temperatureModule/deactivate"
    temperatureModuleAwaitTemperature = \
        "temperatureModule/awaitTemperature"
