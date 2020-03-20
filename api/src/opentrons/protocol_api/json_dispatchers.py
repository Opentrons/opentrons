from typing import Dict
from opentrons.protocol_api.execute_v3 import _blowout, _pick_up_tip, \
    _drop_tip, _aspirate, _dispense, _touch_tip
from opentrons.protocol_api.execute_v4 import _engage_magnet, \
    _disengage_magnet, _temperature_module_set_temp, \
    _temperature_module_deactivate, \
    _temperature_module_await_temp
from .types import PipetteHandler, MagneticModuleHandler, \
                   TemperatureModuleHandler
from .constants import JsonCommand


pipette_command_map: Dict[str, PipetteHandler] = {
    JsonCommand.blowout.value: _blowout,
    JsonCommand.pickUpTip.value: _pick_up_tip,
    JsonCommand.dropTip.value: _drop_tip,
    JsonCommand.aspirate.value: _aspirate,
    JsonCommand.dispense.value: _dispense,
    JsonCommand.touchTip.value: _touch_tip,
}

magnetic_module_command_map: Dict[str, MagneticModuleHandler] = {
    JsonCommand.magneticModuleEngageMagnet.value: _engage_magnet,
    JsonCommand.magneticModuleDisengageMagnet.value: _disengage_magnet,
}

temperature_module_command_map: Dict[str, TemperatureModuleHandler] = {
    JsonCommand.temperatureModuleSetTargetTemperature.value:
        _temperature_module_set_temp,
    JsonCommand.temperatureModuleDeactivate.value:
        _temperature_module_deactivate,
    JsonCommand.temperatureModuleAwaitTemperature.value:
        _temperature_module_await_temp
}
