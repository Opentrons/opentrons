"""Command models for Thermocycler commands."""

from .set_target_block_temperature import (
    SetTargetBlockTemperatureCommandType,
    SetTargetBlockTemperatureParams,
    SetTargetBlockTemperatureResult,
    SetTargetBlockTemperature,
    SetTargetBlockTemperatureCreate,
)

from .set_and_wait_for_block_temperature import (
    SetAndWaitForBlockTemperatureCommandType,
    SetAndWaitForBlockTemperatureParams,
    SetAndWaitForBlockTemperatureResult,
    SetAndWaitForBlockTemperature,
    SetAndWaitForBlockTemperatureCreate,
)

from .set_target_lid_temperature import (
    SetTargetLidTemperatureCommandType,
    SetTargetLidTemperatureParams,
    SetTargetLidTemperatureResult,
    SetTargetLidTemperature,
    SetTargetLidTemperatureCreate,
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
    # Set and wait for block temperature command models
    "SetAndWaitForBlockTemperatureCommandType",
    "SetAndWaitForBlockTemperatureParams",
    "SetAndWaitForBlockTemperatureResult",
    "SetAndWaitForBlockTemperature",
    "SetAndWaitForBlockTemperatureCreate",
    # Set target lid temperature command models
    "SetTargetLidTemperatureCommandType",
    "SetTargetLidTemperatureParams",
    "SetTargetLidTemperatureResult",
    "SetTargetLidTemperature",
    "SetTargetLidTemperatureCreate",
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
