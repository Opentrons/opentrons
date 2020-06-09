import enum
from pathlib import Path

from opentrons.config import get_opentrons_path

OPENTRONS_NAMESPACE = 'opentrons'
CUSTOM_NAMESPACE = 'custom_beta'
STANDARD_DEFS_PATH = Path("labware/definitions/2")
OFFSETS_PATH = get_opentrons_path('labware_calibration_offsets_dir_v2')
USER_DEFS_PATH = get_opentrons_path('labware_user_definitions_dir_v2')


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
