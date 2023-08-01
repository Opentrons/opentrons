"""Tip pickup and drop procedures."""
from typing import Optional
from typing_extensions import Protocol as TypingProtocol

from opentrons.hardware_control import HardwareControlAPI

from ..resources import LabwareDataProvider
from ..state import StateView
from ..types import TipGeometry


class TipHandler(TypingProtocol):
    """Pick up and drop tips."""

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


class HardwareTipHandler(TipHandler):
    """Pick up and drop tips, using the Hardware API."""

    def __init__(
        self,
        state_view: StateView,
        hardware_api: HardwareControlAPI,
        labware_data_provider: Optional[LabwareDataProvider] = None,
    ) -> None:
        self._state_view = state_view
        self._hardware_api = hardware_api
        self._labware_data_provider = labware_data_provider or LabwareDataProvider()

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

        await self._hardware_api.drop_tip(
            mount=hw_mount,
            home_after=True if home_after is None else home_after,
        )

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
