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
    thermocyclerSetTargetBlockTemperature = \
        "thermocycler/setTargetBlockTemperature"
    thermocyclerSetTargetLidTemperature = \
        "thermocycler/setTargetLidTemperature"
    thermocyclerAwaitBlockTemperature = \
        "thermocycler/awaitBlockTemperature"
    thermocyclerAwaitLidTemperature = \
        "thermocycler/awaitLidTemperature"
    thermocyclerOpenLid = \
        "thermocycler/openLid"
    thermocyclerCloseLid = \
        "thermocycler/closeLid"
    thermocyclerDeactivateBlock = \
        "thermocycler/deactivateBlock"
    thermocyclerDeactivateLid = \
        "thermocycler/deactivateLid"
    thermocyclerRunProfile = \
        "thermocycler/runProfile"
    thermocyclerAwaitProfileComplete = \
        "thermocycler/awaitProfileComplete"
