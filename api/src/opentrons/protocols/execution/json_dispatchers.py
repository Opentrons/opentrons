from typing import TYPE_CHECKING
from opentrons.protocols.execution.execute_json_v3 import (
    _blowout,
    _pick_up_tip,
    _drop_tip,
    _aspirate,
    _dispense,
    _touch_tip,
    _air_gap,
)
from opentrons.protocols.execution.execute_json_v4 import (
    _engage_magnet,
    _disengage_magnet,
    _temperature_module_set_temp,
    _temperature_module_deactivate,
    _temperature_module_await_temp,
    _thermocycler_close_lid,
    _thermocycler_open_lid,
    _thermocycler_deactivate_block,
    _thermocycler_deactivate_lid,
    _thermocycler_set_block_temperature,
    _thermocycler_set_lid_temperature,
    _thermocycler_run_profile,
)
from opentrons.protocols.execution.execute_json_v5 import _move_to_well

from opentrons.protocol_api.module_contexts import ThermocyclerContext


from opentrons_shared_data.protocol.constants import (
    JsonPipetteCommand,
    JsonMagneticModuleCommand,
    JsonTemperatureModuleCommand,
    JsonThermocyclerCommand,
)

if TYPE_CHECKING:
    from opentrons.protocols.execution.dev_types import (
        PipetteDispatch,
        JsonV4MagneticModuleDispatch,
        JsonV4TemperatureModuleDispatch,
        JsonV4ThermocyclerDispatch,
    )


pipette_command_map: "PipetteDispatch" = {
    JsonPipetteCommand.blowout.value: _blowout,
    JsonPipetteCommand.pickUpTip.value: _pick_up_tip,
    JsonPipetteCommand.dropTip.value: _drop_tip,
    JsonPipetteCommand.aspirate.value: _aspirate,
    JsonPipetteCommand.dispense.value: _dispense,
    JsonPipetteCommand.touchTip.value: _touch_tip,
    JsonPipetteCommand.airGap.value: _air_gap,
    JsonPipetteCommand.moveToWell.value: _move_to_well,
}

magnetic_module_command_map: "JsonV4MagneticModuleDispatch" = {
    JsonMagneticModuleCommand.magneticModuleEngageMagnet.value: _engage_magnet,
    JsonMagneticModuleCommand.magneticModuleDisengageMagnet.value: _disengage_magnet,
}

temperature_module_command_map: "JsonV4TemperatureModuleDispatch" = {
    JsonTemperatureModuleCommand.temperatureModuleSetTargetTemperature.value: _temperature_module_set_temp,
    JsonTemperatureModuleCommand.temperatureModuleDeactivate.value: _temperature_module_deactivate,
    JsonTemperatureModuleCommand.temperatureModuleAwaitTemperature.value: _temperature_module_await_temp,
}


def tc_do_nothing(module: ThermocyclerContext, params) -> None:
    pass


thermocycler_module_command_map: "JsonV4ThermocyclerDispatch" = {
    JsonThermocyclerCommand.thermocyclerCloseLid.value: _thermocycler_close_lid,
    JsonThermocyclerCommand.thermocyclerOpenLid.value: _thermocycler_open_lid,
    JsonThermocyclerCommand.thermocyclerDeactivateBlock.value: _thermocycler_deactivate_block,
    JsonThermocyclerCommand.thermocyclerDeactivateLid.value: _thermocycler_deactivate_lid,
    JsonThermocyclerCommand.thermocyclerSetTargetBlockTemperature.value: _thermocycler_set_block_temperature,
    JsonThermocyclerCommand.thermocyclerSetTargetLidTemperature.value: _thermocycler_set_lid_temperature,
    JsonThermocyclerCommand.thermocyclerRunProfile.value: _thermocycler_run_profile,
    # NOTE: the thermocyclerAwaitX commands are expected to always
    # follow a corresponding SetX command, which is implemented as
    # blocking. Then nothing needs to be done for awaitX commands.
    JsonThermocyclerCommand.thermocyclerAwaitBlockTemperature.value: tc_do_nothing,
    JsonThermocyclerCommand.thermocyclerAwaitLidTemperature.value: tc_do_nothing,
    JsonThermocyclerCommand.thermocyclerAwaitProfileComplete.value: tc_do_nothing,
}
