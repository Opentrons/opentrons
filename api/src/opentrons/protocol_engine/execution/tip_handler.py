"""Tip pickup and drop procedures."""
from typing import Optional, Dict
from typing_extensions import Protocol as TypingProtocol

from opentrons.hardware_control import HardwareControlAPI
from opentrons_shared_data.errors.exceptions import (
    CommandPreconditionViolated,
    CommandParameterLimitViolated,
)

from ..resources import LabwareDataProvider
from ..state import StateView
from ..types import TipGeometry


PRIMARY_NOZZLE_TO_ENDING_NOZZLE_MAP = {
    "A1": {"COLUMN": "H1", "ROW": "A12"},
    "H1": {"COLUMN": "A1", "ROW": "H12"},
    "A12": {"COLUMN": "H12", "ROW": "A1"},
    "H12": {"COLUMN": "A12", "ROW": "H1"},
}


class TipHandler(TypingProtocol):
    """Pick up and drop tips."""

    async def available_for_nozzle_layout(
        self,
        pipette_id: str,
        style: str,
        primary_nozzle: Optional[str] = None,
        front_right_nozzle: Optional[str] = None,
    ) -> Dict[str, str]:
        """Check nozzle layout is compatible with the pipette.

        Returns:
            A dict of nozzles used to configure the pipette.
        """
        ...

    async def pick_up_tip(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
    ) -> TipGeometry:
        """Pick up the named tip.

        Pipette should be in place over the named tip prior to calling this method.

        Returns:
            Tip geometry of the picked up tip.
        """
        ...

    async def drop_tip(self, pipette_id: str, home_after: Optional[bool]) -> None:
        """Drop the attached tip into the named location.

        Pipette should be in place over the destination prior to calling this method.
        """

    async def add_tip(self, pipette_id: str, tip: TipGeometry) -> None:
        """Tell the Hardware API that a tip is attached."""


async def _available_for_nozzle_layout(
    channels: int,
    style: str,
    primary_nozzle: Optional[str],
    front_right_nozzle: Optional[str],
) -> Dict[str, str]:
    """Check nozzle layout is compatible with the pipette.

    Returns:
        A dict of nozzles used to configure the pipette.
    """
    if channels == 1:
        raise CommandPreconditionViolated(
            message=f"Cannot configure nozzle layout with a {channels} channel pipette."
        )
    if style == "EMPTY":
        return {}
    if style == "ROW" and channels == 8:
        raise CommandParameterLimitViolated(
            command_name="configure_nozzle_layout",
            parameter_name="RowNozzleLayout",
            limit_statement="RowNozzleLayout is incompatible with {channels} channel pipettes.",
            actual_value=str(primary_nozzle),
        )
    if not primary_nozzle:
        return {"primary_nozzle": "A1"}
    if style == "SINGLE":
        return {"primary_nozzle": primary_nozzle}
    if not front_right_nozzle:
        return {
            "primary_nozzle": primary_nozzle,
            "front_right_nozzle": PRIMARY_NOZZLE_TO_ENDING_NOZZLE_MAP[primary_nozzle][
                style
            ],
        }
    return {
        "primary_nozzle": primary_nozzle,
        "front_right_nozzle": front_right_nozzle,
    }


class HardwareTipHandler(TipHandler):
    """Pick up and drop tips, using the Hardware API."""

    def __init__(
        self,
        state_view: StateView,
        hardware_api: HardwareControlAPI,
        labware_data_provider: Optional[LabwareDataProvider] = None,
    ) -> None:
        self._hardware_api = hardware_api
        self._labware_data_provider = labware_data_provider or LabwareDataProvider()
        self._state_view = state_view

    async def available_for_nozzle_layout(
        self,
        pipette_id: str,
        style: str,
        primary_nozzle: Optional[str] = None,
        front_right_nozzle: Optional[str] = None,
    ) -> Dict[str, str]:
        """Returns configuration for nozzle layout to pass to configure_nozzle_layout."""
        if self._state_view.pipettes.get_attached_tip(pipette_id):
            raise CommandPreconditionViolated(
                message=f"Cannot configure nozzle layout of {str(self)} while it has tips attached."
            )
        channels = self._state_view.pipettes.get_channels(pipette_id)
        return await _available_for_nozzle_layout(
            channels, style, primary_nozzle, front_right_nozzle
        )

    async def pick_up_tip(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
    ) -> TipGeometry:
        """Pick up a tip at the current location using the Hardware API."""
        hw_mount = self._state_view.pipettes.get_mount(pipette_id).to_hw_mount()

        nominal_tip_geometry = self._state_view.geometry.get_nominal_tip_geometry(
            pipette_id=pipette_id, labware_id=labware_id, well_name=well_name
        )

        actual_tip_length = await self._labware_data_provider.get_calibrated_tip_length(
            pipette_serial=self._state_view.pipettes.get_serial_number(pipette_id),
            labware_definition=self._state_view.labware.get_definition(labware_id),
            nominal_fallback=nominal_tip_geometry.length,
        )

        await self._hardware_api.pick_up_tip(
            mount=hw_mount,
            tip_length=actual_tip_length,
            presses=None,
            increment=None,
        )

        self._hardware_api.set_current_tiprack_diameter(
            mount=hw_mount,
            tiprack_diameter=nominal_tip_geometry.diameter,
        )

        self._hardware_api.set_working_volume(
            mount=hw_mount,
            tip_volume=nominal_tip_geometry.volume,
        )

        return TipGeometry(
            length=actual_tip_length,
            diameter=nominal_tip_geometry.diameter,
            volume=nominal_tip_geometry.volume,
        )

    async def drop_tip(self, pipette_id: str, home_after: Optional[bool]) -> None:
        """Drop a tip at the current location using the Hardware API."""
        hw_mount = self._state_view.pipettes.get_mount(pipette_id).to_hw_mount()

        # Let the hardware controller handle defaulting home_after since its behavior
        # differs between machines
        if home_after is not None:
            kwargs = {"home_after": home_after}
        else:
            kwargs = {}

        await self._hardware_api.drop_tip(mount=hw_mount, **kwargs)

    async def add_tip(self, pipette_id: str, tip: TipGeometry) -> None:
        """Tell the Hardware API that a tip is attached."""
        hw_mount = self._state_view.pipettes.get_mount(pipette_id).to_hw_mount()

        await self._hardware_api.add_tip(mount=hw_mount, tip_length=tip.length)

        self._hardware_api.set_current_tiprack_diameter(
            mount=hw_mount,
            tiprack_diameter=tip.diameter,
        )

        self._hardware_api.set_working_volume(
            mount=hw_mount,
            tip_volume=tip.volume,
        )


class VirtualTipHandler(TipHandler):
    """Pick up and drop tips, using a virtual pipette."""

    def __init__(self, state_view: StateView) -> None:
        self._state_view = state_view

    async def pick_up_tip(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
    ) -> TipGeometry:
        """Pick up a tip at the current location using a virtual pipette.

        - Fetch nominal tip geometry
        - Check that there's no tip currently attached
        """
        nominal_tip_geometry = self._state_view.geometry.get_nominal_tip_geometry(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
        )

        self._state_view.pipettes.validate_tip_state(
            pipette_id=pipette_id,
            expected_has_tip=False,
        )

        return nominal_tip_geometry

    async def available_for_nozzle_layout(
        self,
        pipette_id: str,
        style: str,
        primary_nozzle: Optional[str] = None,
        front_right_nozzle: Optional[str] = None,
    ) -> Dict[str, str]:
        """Returns configuration for nozzle layout to pass to configure_nozzle_layout."""
        if self._state_view.pipettes.get_attached_tip(pipette_id):
            raise CommandPreconditionViolated(
                message=f"Cannot configure nozzle layout of {str(self)} while it has tips attached."
            )
        channels = self._state_view.pipettes.get_channels(pipette_id)
        return await _available_for_nozzle_layout(
            channels, style, primary_nozzle, front_right_nozzle
        )

    async def drop_tip(
        self,
        pipette_id: str,
        home_after: Optional[bool],
    ) -> None:
        """Pick up a tip at the current location using a virtual pipette.

        - Check that there's no tip currently attached
        """
        self._state_view.pipettes.validate_tip_state(
            pipette_id=pipette_id,
            expected_has_tip=True,
        )

    async def add_tip(self, pipette_id: str, tip: TipGeometry) -> None:
        """Add a tip using a virtual pipette.

        This should not be called when using virtual pipettes.
        """
        assert False, "TipHandler.add_tip should not be used with virtual pipettes"


def create_tip_handler(
    state_view: StateView, hardware_api: HardwareControlAPI
) -> TipHandler:
    """Create a tip handler."""
    return (
        HardwareTipHandler(state_view=state_view, hardware_api=hardware_api)
        if state_view.config.use_virtual_pipettes is False
        else VirtualTipHandler(state_view=state_view)
    )
