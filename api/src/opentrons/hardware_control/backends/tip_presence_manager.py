import logging
from functools import partial
from typing import cast, Callable, Optional, List, Set
from typing_extensions import TypedDict, Literal, Final

from opentrons.hardware_control.types import TipStateType, OT3Mount

from opentrons_hardware.drivers.can_bus import CanMessenger
from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons_hardware.hardware_control.tip_presence import (
    TipDetector,
    types as tip_types,
)
from opentrons_shared_data.errors.exceptions import (
    TipDetectorNotFound,
    UnmatchedTipPresenceStates,
)

log = logging.getLogger(__name__)

TipListener = Callable[[OT3Mount, bool], None]
PipetteMountKeys = Literal["left", "right"]


class TipDetectorByMount(TypedDict):
    left: Optional[TipDetector]
    right: Optional[TipDetector]


class TipUpdateByMount(TypedDict):
    left: Optional[bool]
    right: Optional[bool]


def _mount_to_node(mount: OT3Mount) -> NodeId:
    return {
        OT3Mount.LEFT: NodeId.pipette_left,
        OT3Mount.RIGHT: NodeId.pipette_right,
    }[mount]


class TipPresenceManager:
    """Handle tip change notification coming from CAN."""

    _listeners: Set[TipListener]
    _detectors: TipDetectorByMount
    _last_state: TipUpdateByMount

    def __init__(
        self,
        can_messenger: CanMessenger,
        listeners: Set[TipListener] = set(),
    ) -> None:
        self._messenger = can_messenger
        self._listeners = listeners
        self._detectors = TipDetectorByMount(left=None, right=None)
        self._last_state = TipUpdateByMount(left=None, right=None)

    @staticmethod
    def _get_key(mount: OT3Mount) -> PipetteMountKeys:
        assert mount != OT3Mount.GRIPPER
        return cast(PipetteMountKeys, mount.name.lower())

    async def build_detector(self, mount: OT3Mount, sensor_count: int) -> None:
        # clear detector if pipette does not exist
        if sensor_count <= 0:
            self.set_detector(mount, None)
        else:
            # set up and subscribe to the detector
            d = TipDetector(self._messenger, _mount_to_node(mount), sensor_count)
            # listens to the detector so we can immediately notify listeners
            # the most up-to-date tip state
            d.add_subscriber(partial(self._handle_tip_update, mount))
            self.set_detector(mount, d)

    def _handle_tip_update(
        self, mount: OT3Mount, update: tip_types.TipNotification
    ) -> None:
        """Callback for detector."""
        self._last_state[self._get_key(mount)] = update.presence

        for listener in self._listeners:
            listener(mount, update.presence)

    def current_tip_state(self, mount: OT3Mount) -> Optional[bool]:
        state = self._last_state[self._get_key(mount)]
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
        detector = self._detectors[self._get_key(mount)]
        if not detector:
            raise TipDetectorNotFound(
                message=f"Tip detector not set up for {mount} mount",
                detail={"mount": str(mount)},
            )
        return detector

    def set_detector(self, mount: OT3Mount, detector: Optional[TipDetector]) -> None:
        self._detectors[self._get_key(mount)] = detector

    def add_listener(self, listener: TipListener) -> Callable[[], None]:
        self._listeners.add(listener)

        def remove() -> None:
            self._listeners.discard(listener)

        return remove
