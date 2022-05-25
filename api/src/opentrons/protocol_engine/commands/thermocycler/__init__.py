"""Command models for Thermocycler commands."""

from .set_target_block_temperature import (
    SetTargetBlockTemperatureCommandType,
    SetTargetBlockTemperatureParams,
    SetTargetBlockTemperatureResult,
    SetTargetBlockTemperature,
    SetTargetBlockTemperatureCreate,
)

from .wait_for_block_temperature import (
    WaitForBlockTemperatureCommandType,
    WaitForBlockTemperatureParams,
    WaitForBlockTemperatureResult,
    WaitForBlockTemperature,
    WaitForBlockTemperatureCreate,
)

from .set_target_lid_temperature import (
    SetTargetLidTemperatureCommandType,
    SetTargetLidTemperatureParams,
    SetTargetLidTemperatureResult,
    SetTargetLidTemperature,
    SetTargetLidTemperatureCreate,
)

from .wait_for_lid_temperature import (
    WaitForLidTemperatureCommandType,
    WaitForLidTemperatureParams,
    WaitForLidTemperatureResult,
    WaitForLidTemperature,
    WaitForLidTemperatureCreate,
)

from .deactivate_block import (
    DeactivateBlockCommandType,
    DeactivateBlockParams,
    DeactivateBlockResult,
    DeactivateBlock,
    DeactivateBlockCreate,
)

from .deactivate_lid import (
    DeactivateLidCommandType,
    DeactivateLidParams,
    DeactivateLidResult,
    DeactivateLid,
    DeactivateLidCreate,
)


__all__ = [
    # Set target block temperature command models
    "SetTargetBlockTemperatureCommandType",
    "SetTargetBlockTemperatureParams",
    "SetTargetBlockTemperatureResult",
    "SetTargetBlockTemperature",
    "SetTargetBlockTemperatureCreate",
    # Wait for block temperature command models
    "WaitForBlockTemperatureCommandType",
    "WaitForBlockTemperatureParams",
    "WaitForBlockTemperatureResult",
    "WaitForBlockTemperature",
    "WaitForBlockTemperatureCreate",
    # Set target lid temperature command models
    "SetTargetLidTemperatureCommandType",
    "SetTargetLidTemperatureParams",
    "SetTargetLidTemperatureResult",
    "SetTargetLidTemperature",
    "SetTargetLidTemperatureCreate",
    # Wait for lid temperature command models
    "WaitForLidTemperatureCommandType",
    "WaitForLidTemperatureParams",
    "WaitForLidTemperatureResult",
    "WaitForLidTemperature",
    "WaitForLidTemperatureCreate",
    # Deactivate block command models
    "DeactivateBlockCommandType",
    "DeactivateBlockParams",
    "DeactivateBlockResult",
    "DeactivateBlock",
    "DeactivateBlockCreate",
    # Deactivate lid command models
    "DeactivateLidCommandType",
    "DeactivateLidParams",
    "DeactivateLidResult",
    "DeactivateLid",
    "DeactivateLidCreate",
]
