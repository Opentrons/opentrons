import logging
from functools import partial
from typing import Callable, Optional, List, Dict


from opentrons.hardware_control.types import TipStateType, OT3Mount

from opentrons_hardware.drivers.can_bus import CanMessenger
from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons_hardware.hardware_control.tip_presence import (
    TipDetector,
    types as tip_types,
)
from opentrons_shared_data.errors.exceptions import UnmatchedTipPresenceStates

log = logging.getLogger(__name__)

TipListener = Callable[[OT3Mount, bool], None]
TipDetectorByMount = Dict[OT3Mount, Optional[TipDetector]]
TipUpdateByMount = Dict[OT3Mount, Optional[bool]]


class TipDetectorNotFoundError(Exception):
    pass


def _mount_to_node(mount: OT3Mount) -> NodeId:
    return {
        OT3Mount.LEFT: NodeId.pipette_left,
        OT3Mount.RIGHT: NodeId.pipette_right,
    }[mount]


class TipPresenceManager:
    """Handle tip change notification coming from CAN."""

    _listeners: List[TipListener]
    _detectors: TipDetectorByMount
    _last_state: TipUpdateByMount

    def __init__(self, can_messenger: CanMessenger) -> None:
        self._messenger = can_messenger
        self._listeners = []
        self._detectors = {m: None for m in OT3Mount}
        self._last_state = {m: None for m in OT3Mount}

    async def build_detector(self, mount: OT3Mount, sensor_count: int) -> None:
        # clear detector if pipette does not exist
        if not sensor_count > 0:
            self._detectors[mount] = None
        else:
            # set up and subscribe to the detector
            d = TipDetector(self._messenger, _mount_to_node(mount), sensor_count)
            # listens to the detector so we can immediately notify listeners
            # the most up-to-date tip state
            d.add_subscriber(partial(self._handle_tip_update, mount))
            self._detectors[mount] = d

    def _handle_tip_update(
        self, mount: OT3Mount, update: tip_types.TipNotification
    ) -> None:
        """Callback for detector."""
        self._last_state[mount] = update.presence

        for listener in self._listeners:
            listener(mount, update.presence)

    def current_tip_state(self, mount: OT3Mount) -> Optional[bool]:
        state = self._last_state[mount]
        if state is None:
            log.warning("Tip state for {mount} is unknown")
        return state

    @staticmethod
    def _get_tip_presence(results: List[tip_types.TipNotification]) -> TipStateType:
        # more than one sensor reported, we have to check if their states match
        if len(set(r.presence for r in results)) > 1:
            raise UnmatchedTipPresenceStates(
                {int(r.sensor): int(r.presence) for r in results}
            )
        return TipStateType(results[0].presence)

    async def get_tip_status(self, mount: OT3Mount) -> TipStateType:
        detector = self.get_detector(mount)
        return self._get_tip_presence(await detector.request_tip_status())

    def get_detector(self, mount: OT3Mount) -> TipDetector:
        detector = self._detectors[mount]
        if not detector:
            raise TipDetectorNotFoundError(f"Tip detector not set up for {mount} mount")
        return detector

    def add_listener(self, listener: TipListener) -> None:
        if listener not in self._listeners:
            self._listeners.append(listener)
