"""Grab data from the pipette to flesh out a pipette definition."""

from opentrons_shared_data.pipette.pipette_definition import (
    PipetteConfigurations,
)

from opentrons_hardware.drivers.can_bus import CanMessenger
from opentrons_hardware.firmware_bindings.constants import NodeId

SUPPORTED_PIPETTE_DEF_DATA_REV = 1


def pipette_supports_onboard_data(messenger: CanMessenger, node: NodeId) -> bool:
    """Ask the pipette if it has onboard pipette definition data."""
    # TODO implement, check if pipette has a pipette def data rev
    return False


def amend_pipette_definition(
    generic_config: PipetteConfigurations, messenger: CanMessenger, node: NodeId
) -> PipetteConfigurations:
    """Update the closest pipette def we have with the data stored onboard the pipette."""
    # TODO implement
    return generic_config
