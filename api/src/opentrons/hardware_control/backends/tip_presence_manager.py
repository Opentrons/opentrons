import logging
from functools import partial
from typing import cast, Callable, Optional, List, Set
from typing_extensions import TypedDict, Literal

from opentrons.hardware_control.types import TipStateType, OT3Mount, InstrumentProbeType

from opentrons_hardware.drivers.can_bus import CanMessenger
from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons_hardware.hardware_control.tip_presence import (
    TipDetector,
    types as tip_types,
)
from opentrons_shared_data.errors.exceptions import (
    TipDetectorNotFound,
    UnmatchedTipPresenceStates,
    GeneralError,
)

from .ot3utils import sensor_id_for_instrument

log = logging.getLogger(__name__)

TipListener = Callable[[OT3Mount, bool], None]
PipetteMountKeys = Literal["left", "right"]


class TipDetectorByMount(TypedDict):
    left: Optional[TipDetector]
    right: Optional[TipDetector]


class UnsubMethodByMount(TypedDict):
    left: Optional[Callable[[], None]]
    right: Optional[Callable[[], None]]


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
    _unsub_methods: UnsubMethodByMount
    _last_state: TipUpdateByMount

    def __init__(
        self,
        can_messenger: CanMessenger,
        listeners: Set[TipListener] = set(),
    ) -> None:
        self._messenger = can_messenger
        self._listeners = listeners
        self._detectors = TipDetectorByMount(left=None, right=None)
        self._unsub_methods = UnsubMethodByMount(left=None, right=None)
        self._last_state = TipUpdateByMount(left=None, right=None)

    @staticmethod
    def _get_key(mount: OT3Mount) -> PipetteMountKeys:
        assert mount != OT3Mount.GRIPPER
        return cast(PipetteMountKeys, mount.name.lower())

    async def clear_detector(self, mount: OT3Mount) -> None:
        """Clean up and remove tip detector."""

        def _unsubscribe() -> None:
            """Unsubscribe from detector."""
            unsub = self._unsub_methods[self._get_key(mount)]
            if unsub:
                unsub()
                self.set_unsub(mount, None)

        try:
            detector = self.get_detector(mount)
            detector.cleanup()
        except TipDetectorNotFound:
            pass
        finally:
            _unsubscribe()
            self.set_detector(mount, None)

    async def build_detector(self, mount: OT3Mount, sensor_count: int) -> None:
        assert self._detectors.get(self._get_key(mount), None) is None
        # set up and subscribe to the detector
        d = TipDetector(self._messenger, _mount_to_node(mount), sensor_count)
        # listens to the detector so we can immediately notify listeners
        # the most up-to-date tip state
        unsub = d.add_subscriber(partial(self._handle_tip_update, mount))
        self.set_unsub(mount, unsub)
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
        return state

    @staticmethod
    def _get_tip_presence(
        results: List[tip_types.TipNotification],
        follow_singular_sensor: Optional[InstrumentProbeType] = None,
    ) -> TipStateType:
        """
        We can use follow_singular_sensor used to specify that we only care
        about the status of one tip presence sensor on a high throughput
        pipette, and the other is allowed to be different.
        """
        if follow_singular_sensor:
            target_sensor_id = sensor_id_for_instrument(follow_singular_sensor)
            for r in results:
                if r.sensor == target_sensor_id:
                    return TipStateType(r.presence)
            # raise an error if requested sensor response isn't found
            raise GeneralError(
                message=f"Requested status for sensor {follow_singular_sensor} not found."
            )
        # more than one sensor reported, we have to check if their states match
        if len(set(r.presence for r in results)) > 1:
            raise UnmatchedTipPresenceStates(
                {int(r.sensor): int(r.presence) for r in results}
            )
        return TipStateType(results[0].presence)

    async def get_tip_status(
        self,
        mount: OT3Mount,
        follow_singular_sensor: Optional[InstrumentProbeType] = None,
    ) -> TipStateType:
        detector = self.get_detector(mount)
        return self._get_tip_presence(
            await detector.request_tip_status(), follow_singular_sensor
        )

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

    def set_unsub(self, mount: OT3Mount, unsub: Optional[Callable[[], None]]) -> None:
        self._unsub_methods[self._get_key(mount)] = unsub

    def add_listener(self, listener: TipListener) -> Callable[[], None]:
        self._listeners.add(listener)

        def remove() -> None:
            self._listeners.discard(listener)

        return remove
