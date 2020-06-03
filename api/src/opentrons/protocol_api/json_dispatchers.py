from typing import Dict, TYPE_CHECKING
from opentrons.protocol_api.execute_v3 import _blowout, _pick_up_tip, \
    _drop_tip, _aspirate, _dispense, _touch_tip
from opentrons.protocol_api.execute_v4 import _engage_magnet, \
    _disengage_magnet, _temperature_module_set_temp, \
    _temperature_module_deactivate, \
    _temperature_module_await_temp, \
    _thermocycler_close_lid, \
    _thermocycler_open_lid, \
    _thermocycler_deactivate_block, \
    _thermocycler_deactivate_lid, \
    _thermocycler_set_block_temperature, \
    _thermocycler_set_lid_temperature, \
    _thermocycler_run_profile

from .types import ThermocyclerContext


from opentrons_shared_data.protocol.constants import JsonCommand

if TYPE_CHECKING:
    from .dev_types import (
        JsonV4PipetteDispatch, JsonV4MagneticModuleDispatch,
        JsonV4TemperatureModuleDispatch,
        JsonV4ThermocyclerDispatch
    )


def not_implemented(*args, **kwargs) -> None:
    raise NotImplementedError('Not implemented')

pipette_command_map: 'JsonV4PipetteDispatch' = {
    JsonCommand.blowout.value: _blowout,
    JsonCommand.pickUpTip.value: _pick_up_tip,
    JsonCommand.dropTip.value: _drop_tip,
    JsonCommand.aspirate.value: _aspirate,
    JsonCommand.dispense.value: _dispense,
    JsonCommand.touchTip.value: _touch_tip,
    JsonCommand.airGap.value: not_implemented,
}

magnetic_module_command_map: 'JsonV4MagneticModuleDispatch' = {
    JsonCommand.magneticModuleEngageMagnet.value: _engage_magnet,
    JsonCommand.magneticModuleDisengageMagnet.value: _disengage_magnet,
}

temperature_module_command_map: 'JsonV4TemperatureModuleDispatch' = {
    JsonCommand.temperatureModuleSetTargetTemperature.value:
        _temperature_module_set_temp,
    JsonCommand.temperatureModuleDeactivate.value:
        _temperature_module_deactivate,
    JsonCommand.temperatureModuleAwaitTemperature.value:
        _temperature_module_await_temp
}


def tc_do_nothing(module: ThermocyclerContext, params) -> None:
    pass


thermocycler_module_command_map: 'JsonV4ThermocyclerDispatch' =
    {
        JsonCommand.thermocyclerCloseLid.value:
            _thermocycler_close_lid,
        JsonCommand.thermocyclerOpenLid.value:
            _thermocycler_open_lid,
        JsonCommand.thermocyclerDeactivateBlock.value:
            _thermocycler_deactivate_block,
        JsonCommand.thermocyclerDeactivateLid.value:
            _thermocycler_deactivate_lid,
        JsonCommand.thermocyclerSetTargetBlockTemperature.value:
            _thermocycler_set_block_temperature,
        JsonCommand.thermocyclerSetTargetLidTemperature.value:
            _thermocycler_set_lid_temperature,
        JsonCommand.thermocyclerRunProfile.value:
            _thermocycler_run_profile,
        # NOTE: the thermocyclerAwaitX commands are expected to always
        # follow a corresponding SetX command, which is implemented as
        # blocking. Then nothing needs to be done for awaitX commands.
        JsonCommand.thermocyclerAwaitBlockTemperature.value: \
        tc_do_nothing,
        JsonCommand.thermocyclerAwaitLidTemperature.value: \
        tc_do_nothing,
        JsonCommand.thermocyclerAwaitProfileComplete.value: \
        tc_do_nothing,
    }
