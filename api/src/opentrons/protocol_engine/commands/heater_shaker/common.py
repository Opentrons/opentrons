"""Common heatershaker base models."""

from opentrons.protocol_engine.state.module_substates.heater_shaker_module_substate import (
    HeaterShakerModuleSubState,
)


async def get_heatershaker_ready_to_shake(
    hs_module_substate: HeaterShakerModuleSubState,
    rpm: float,
) -> int:
    """Check heatershaker state to confirm if it is ready to shake.

    This includes
    - Checking latch closure
    - Validating target speed
    """
    hs_module_substate.raise_if_labware_latch_not_closed()
    # Verify speed from hs module view
    validated_speed = hs_module_substate.validate_target_speed(rpm)
    return validated_speed
