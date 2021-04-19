import pytest

from opentrons.protocols.runner.json_proto.models import json_protocol as models


@pytest.fixture
def liquid_command_params() -> models.Params:
    return models.Params(offsetFromBottomMm=1, volume=1, pipette="pipette",
                         labware="labware", well="A1", flowRate=1)


@pytest.fixture
def aspirate_command(liquid_command_params) -> models.LiquidCommand:
    return models.LiquidCommand(command='aspirate',
                                params=liquid_command_params)


@pytest.fixture
def dispense_command(liquid_command_params) -> models.LiquidCommand:
    return models.LiquidCommand(command='dispense',
                                params=liquid_command_params)


@pytest.fixture
def air_gap_command(liquid_command_params) -> models.LiquidCommand:
    return models.LiquidCommand(command='airGap', params=liquid_command_params)


@pytest.fixture
def blowout_command(liquid_command_params) -> models.BlowoutCommand:
    return models.BlowoutCommand(command='blowout',
                                 params=liquid_command_params)


@pytest.fixture
def touch_tip_command(liquid_command_params) -> models.TouchTipCommand:
    return models.TouchTipCommand(command='touchTip',
                                  params=liquid_command_params)


@pytest.fixture
def pick_up_command(liquid_command_params) -> models.PickUpDropTipCommand:
    return models.PickUpDropTipCommand(
        command='pickUpTip',
        params=liquid_command_params
    )


@pytest.fixture
def drop_tip_command(liquid_command_params) -> models.PickUpDropTipCommand:
    return models.PickUpDropTipCommand(
        command='dropTip',
        params=liquid_command_params
    )


@pytest.fixture
def move_to_slot_command() -> models.MoveToSlotCommand:
    return models.MoveToSlotCommand(
        command='moveToSlot',
        params=models.Params3(pipette="pipette", slot="1")
    )


@pytest.fixture
def delay_command() -> models.DelayCommand:
    return models.DelayCommand(
        command="delay",
        params=models.Params4(wait=True)
    )


@pytest.fixture
def magnetic_module_engage_command() -> models.MagneticModuleEngageCommand:
    return models.MagneticModuleEngageCommand(
        command='magneticModule/engageMagnet',
        params=models.Params5(engageHeight=1, module="module")
    )


@pytest.fixture
def magnetic_module_disengage_command() -> models.MagneticModuleDisengageCommand:
    return models.MagneticModuleDisengageCommand(
        command='magneticModule/disengageMagnet',
        params=models.ModuleOnlyParams(module="module")
    )


@pytest.fixture
def temperature_module_set_target_command() \
        -> models.TemperatureModuleSetTargetCommand:
    return models.TemperatureModuleSetTargetCommand(
        command='temperatureModule/setTargetTemperature',
        params=models.Params6(module="module", temperature=1)
    )


@pytest.fixture
def temperature_module_await_temperature_command() \
        -> models.TemperatureModuleAwaitTemperatureCommand:
    return models.TemperatureModuleAwaitTemperatureCommand(
        command='temperatureModule/awaitTemperature',
        params=models.Params7(module="module", temperature=1)
    )


@pytest.fixture
def temperature_module_deactivate_command() \
        -> models.TemperatureModuleDeactivateCommand:
    return models.TemperatureModuleDeactivateCommand(
        command='temperatureModule/deactivate',
        params=models.ModuleOnlyParams(module="module")
    )


@pytest.fixture
def thermocycler_set_target_block_temperature_command() \
        -> models.ThermocyclerSetTargetBlockTemperatureCommand:
    return models.ThermocyclerSetTargetBlockTemperatureCommand(
        command='thermocycler/setTargetBlockTemperature',
        params=models.Params8(module="module", temperature=1)
    )


@pytest.fixture
def thermocycler_set_target_lid_temperature_command() \
        -> models.ThermocyclerSetTargetLidTemperatureCommand:
    return models.ThermocyclerSetTargetLidTemperatureCommand(
        command='thermocycler/setTargetLidTemperature',
        params=models.Params9(module="module", temperature=1)
    )


@pytest.fixture
def thermocycler_await_block_temperature_command() \
        -> models.ThermocyclerAwaitBlockTemperatureCommand:
    return models.ThermocyclerAwaitBlockTemperatureCommand(
        command='thermocycler/awaitBlockTemperature',
        params=models.Params10(module="module", temperature=1)
    )


@pytest.fixture
def thermocycler_await_lid_temperature_command()\
        -> models.ThermocyclerAwaitLidTemperatureCommand:
    return models.ThermocyclerAwaitLidTemperatureCommand(
        command='thermocycler/awaitLidTemperature',
        params=models.Params11(module="module", temperature=1)
    )


@pytest.fixture
def thermocycler_deactivate_block_command() \
        -> models.ThermocyclerDeactivateBlockCommand:
    return models.ThermocyclerDeactivateBlockCommand(
        command='thermocycler/deactivateBlock',
        params=models.ModuleOnlyParams(module="module")
    )


@pytest.fixture
def thermocycler_deactivate_lid_command() -> models.ThermocyclerDeactivateLidCommand:
    return models.ThermocyclerDeactivateLidCommand(
        command='thermocycler/deactivateLid',
        params=models.ModuleOnlyParams(module="module")
    )


@pytest.fixture
def thermocycler_open_lid_command() -> models.ThermocyclerOpenLidCommand:
    return models.ThermocyclerOpenLidCommand(
        command='thermocycler/openLid',
        params=models.ModuleOnlyParams(module="module")
    )


@pytest.fixture
def thermocycler_close_lid_command() -> models.ThermocyclerCloseLidCommand:
    return models.ThermocyclerCloseLidCommand(
        command='thermocycler/closeLid',
        params=models.ModuleOnlyParams(module="module")
    )


@pytest.fixture
def thermocycler_run_profile() -> models.ThermocyclerRunProfile:
    return models.ThermocyclerRunProfile(
        command='thermocycler/runProfile',
        params=models.Params12(module="module", volume=1, profile=[])
    )


@pytest.fixture
def thermocycler_await_profile_complete_command() \
        -> models.ThermocyclerAwaitProfileCompleteCommand:
    return models.ThermocyclerAwaitProfileCompleteCommand(
        command='thermocycler/awaitProfileComplete',
        params=models.ModuleOnlyParams(module="module")
    )


@pytest.fixture
def move_to_well_command() -> models.MoveToWellCommand:
    return models.MoveToWellCommand(
        command='moveToWell',
        params=models.Params13(
            pipette="pipette",
            labware="labware",
            well="A1",
        )
    )
