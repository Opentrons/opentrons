"""Rail Lights command handling."""

from opentrons.hardware_control import HardwareControlAPI


class RailLightsHandler:
    """Handle interaction with the rail lights."""

    _hardware_api: HardwareControlAPI

    def __init__(
        self,
        hardware_api: HardwareControlAPI,
    ) -> None:
        """Initialize a RailLightsHandler instance."""
        self._hardware_api = hardware_api

    async def set_rail_lights(
        self,
        on: bool,
    ) -> None:
        """Set the rail lights."""
        await self._hardware_api.set_lights(
            rails=on,
        )
