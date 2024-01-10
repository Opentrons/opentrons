"""Pipetting command handling."""
from typing import Optional, Iterator
from typing_extensions import Protocol as TypingProtocol
from contextlib import contextmanager

from opentrons.hardware_control import HardwareControlAPI

from ..state import StateView, HardwarePipette
from ..errors.exceptions import (
    TipNotAttachedError,
    InvalidAspirateVolumeError,
    InvalidPushOutVolumeError,
    InvalidDispenseVolumeError,
)


# 1e-9 µL (1 femtoliter!) is a good value because:
# * It's large relative to rounding errors that occur in practice in protocols. For
#   example, https://opentrons.atlassian.net/browse/RESC-182 shows a rounding error
#   on the order of 1e-15 µL.
# * It's small relative to volumes that our users might actually care about and
#   expect the robot to execute faithfully.
# * It's the default absolute tolerance for math.isclose(), where it apparently works
#   well in general.
_VOLUME_ROUNDING_ERROR_TOLERANCE = 1e-9


class PipettingHandler(TypingProtocol):
    """Liquid handling commands."""

    def get_is_ready_to_aspirate(self, pipette_id: str) -> bool:
        """Get whether a pipette is ready to aspirate."""

    async def prepare_for_aspirate(self, pipette_id: str) -> None:
        """Prepare for pipette aspiration."""

    async def aspirate_in_place(
        self,
        pipette_id: str,
        volume: float,
        flow_rate: float,
    ) -> float:
        """Set flow-rate and aspirate."""

    async def dispense_in_place(
        self,
        pipette_id: str,
        volume: float,
        flow_rate: float,
        push_out: Optional[float],
    ) -> float:
        """Set flow-rate and dispense."""

    async def blow_out_in_place(
        self,
        pipette_id: str,
        flow_rate: float,
    ) -> None:
        """Set flow rate and blow-out."""


class HardwarePipettingHandler(PipettingHandler):
    """Liquid handling, using the Hardware API.""" ""

    def __init__(self, state_view: StateView, hardware_api: HardwareControlAPI) -> None:
        """Initialize a PipettingHandler instance."""
        self._state_view = state_view
        self._hardware_api = hardware_api

    def get_is_ready_to_aspirate(self, pipette_id: str) -> bool:
        """Get whether a pipette is ready to aspirate."""
        hw_pipette = self._state_view.pipettes.get_hardware_pipette(
            pipette_id=pipette_id,
            attached_pipettes=self._hardware_api.attached_instruments,
        )
        return (
            self._state_view.pipettes.get_aspirated_volume(pipette_id) is not None
            and hw_pipette.config["ready_to_aspirate"]
        )

    async def prepare_for_aspirate(self, pipette_id: str) -> None:
        """Prepare for pipette aspiration."""
        hw_mount = self._state_view.pipettes.get_mount(pipette_id).to_hw_mount()
        await self._hardware_api.prepare_for_aspirate(mount=hw_mount)

    async def aspirate_in_place(
        self,
        pipette_id: str,
        volume: float,
        flow_rate: float,
    ) -> float:
        """Set flow-rate and aspirate."""
        # get mount and config data from state and hardware controller
        hw_pipette = self._state_view.pipettes.get_hardware_pipette(
            pipette_id=pipette_id,
            attached_pipettes=self._hardware_api.attached_instruments,
        )
        with self._set_flow_rate(pipette=hw_pipette, aspirate_flow_rate=flow_rate):
            await self._hardware_api.aspirate(mount=hw_pipette.mount, volume=volume)

        return volume

    async def dispense_in_place(
        self,
        pipette_id: str,
        volume: float,
        flow_rate: float,
        push_out: Optional[float],
    ) -> float:
        """Dispense liquid without moving the pipette."""
        hw_pipette = self._state_view.pipettes.get_hardware_pipette(
            pipette_id=pipette_id,
            attached_pipettes=self._hardware_api.attached_instruments,
        )
        # TODO (tz, 8-23-23): add a check for push_out not larger that the max volume allowed when working on this https://opentrons.atlassian.net/browse/RSS-329
        if push_out and push_out < 0:
            raise InvalidPushOutVolumeError(
                "push out value cannot have a negative value."
            )
        with self._set_flow_rate(pipette=hw_pipette, dispense_flow_rate=flow_rate):
            await self._hardware_api.dispense(
                mount=hw_pipette.mount, volume=volume, push_out=push_out
            )

        return volume

    async def blow_out_in_place(
        self,
        pipette_id: str,
        flow_rate: float,
    ) -> None:
        """Set flow rate and blow-out."""
        # get mount and config data from state and hardware controller
        hw_pipette = self._state_view.pipettes.get_hardware_pipette(
            pipette_id=pipette_id,
            attached_pipettes=self._hardware_api.attached_instruments,
        )
        with self._set_flow_rate(pipette=hw_pipette, blow_out_flow_rate=flow_rate):
            await self._hardware_api.blow_out(mount=hw_pipette.mount)

    @contextmanager
    def _set_flow_rate(
        self,
        pipette: HardwarePipette,
        aspirate_flow_rate: Optional[float] = None,
        dispense_flow_rate: Optional[float] = None,
        blow_out_flow_rate: Optional[float] = None,
    ) -> Iterator[None]:
        """Context manager for setting flow rate before calling aspirate, dispense, or blowout."""
        original_aspirate_rate = pipette.config["aspirate_flow_rate"]
        original_dispense_rate = pipette.config["dispense_flow_rate"]
        original_blow_out_rate = pipette.config["blow_out_flow_rate"]
        self._hardware_api.set_flow_rate(
            pipette.mount,
            aspirate=aspirate_flow_rate,
            dispense=dispense_flow_rate,
            blow_out=blow_out_flow_rate,
        )
        try:
            yield
        finally:
            self._hardware_api.set_flow_rate(
                pipette.mount,
                aspirate=original_aspirate_rate,
                dispense=original_dispense_rate,
                blow_out=original_blow_out_rate,
            )


class VirtualPipettingHandler(PipettingHandler):
    """Liquid handling, using the virtual pipettes.""" ""

    _state_view: StateView

    def __init__(
        self,
        state_view: StateView,
    ) -> None:
        """Initialize a PipettingHandler instance."""
        self._state_view = state_view

    def get_is_ready_to_aspirate(self, pipette_id: str) -> bool:
        """Get whether a pipette is ready to aspirate."""
        return self._state_view.pipettes.get_aspirated_volume(pipette_id) is not None

    async def prepare_for_aspirate(self, pipette_id: str) -> None:
        """Virtually prepare to aspirate (no-op)."""

    async def aspirate_in_place(
        self,
        pipette_id: str,
        volume: float,
        flow_rate: float,
    ) -> float:
        """Virtually aspirate (no-op)."""
        self._validate_tip_attached(pipette_id=pipette_id, command_name="aspirate")
        return self._validate_aspirate_volume(
            pipette_id=pipette_id, aspirate_volume=volume
        )

    async def dispense_in_place(
        self,
        pipette_id: str,
        volume: float,
        flow_rate: float,
        push_out: Optional[float],
    ) -> float:
        """Virtually dispense (no-op)."""
        # TODO (tz, 8-23-23): add a check for push_out not larger that the max volume allowed when working on this https://opentrons.atlassian.net/browse/RSS-329
        if push_out and push_out < 0:
            raise InvalidPushOutVolumeError(
                "push out value cannot have a negative value."
            )
        self._validate_tip_attached(pipette_id=pipette_id, command_name="dispense")
        return self._validate_dispense_volume(
            pipette_id=pipette_id, dispense_volume=volume
        )

    async def blow_out_in_place(
        self,
        pipette_id: str,
        flow_rate: float,
    ) -> None:
        """Virtually blow out (no-op)."""

    def _validate_tip_attached(self, pipette_id: str, command_name: str) -> None:
        """Validate if there is a tip attached."""
        tip_geometry = self._state_view.pipettes.get_attached_tip(pipette_id)
        if not tip_geometry:
            raise TipNotAttachedError(
                f"Cannot perform {command_name} without a tip attached"
            )

    def _validate_aspirate_volume(
        self, pipette_id: str, aspirate_volume: float
    ) -> float:
        """Get whether the aspirated volume is valid to aspirate."""
        working_volume = self._state_view.pipettes.get_working_volume(
            pipette_id=pipette_id
        )

        current_volume = (
            self._state_view.pipettes.get_aspirated_volume(pipette_id=pipette_id) or 0
        )

        available_volume = working_volume - current_volume
        available_volume_with_tolerance = (
            available_volume + _VOLUME_ROUNDING_ERROR_TOLERANCE
        )

        if aspirate_volume > available_volume_with_tolerance:
            raise InvalidAspirateVolumeError(
                attempted_aspirate_volume=aspirate_volume,
                available_volume=available_volume,
                max_pipette_volume=self._state_view.pipettes.get_maximum_volume(
                    pipette_id=pipette_id
                ),
                max_tip_volume=self._get_max_tip_volume(pipette_id=pipette_id),
            )
        else:
            return min(aspirate_volume, available_volume)

    def _validate_dispense_volume(
        self, pipette_id: str, dispense_volume: float
    ) -> float:
        """Validate dispense volume."""
        aspirated_volume = self._state_view.pipettes.get_aspirated_volume(pipette_id)
        if aspirated_volume is None:
            raise InvalidDispenseVolumeError(
                "Cannot perform a dispense if there is no volume in attached tip."
            )
        else:
            remaining = aspirated_volume - dispense_volume
            if remaining < -_VOLUME_ROUNDING_ERROR_TOLERANCE:
                raise InvalidDispenseVolumeError(
                    f"Cannot dispense {dispense_volume} µL when only {aspirated_volume} µL has been aspirated."
                )
            else:
                return min(dispense_volume, aspirated_volume)

    def _get_max_tip_volume(self, pipette_id: str) -> Optional[float]:
        attached_tip = self._state_view.pipettes.get_attached_tip(pipette_id=pipette_id)
        return None if attached_tip is None else attached_tip.volume


def create_pipetting_handler(
    state_view: StateView, hardware_api: HardwareControlAPI
) -> PipettingHandler:
    """Create a pipetting handler."""
    return (
        HardwarePipettingHandler(state_view=state_view, hardware_api=hardware_api)
        if state_view.config.use_virtual_pipettes is False
        else VirtualPipettingHandler(state_view=state_view)
    )
