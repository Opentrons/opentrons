import pytest
from typing import AsyncIterator, Dict
from decoy import Decoy

from opentrons.hardware_control.types import OT3Mount, TipStateType
from opentrons.hardware_control.backends.tip_presence_manager import TipPresenceManager
from opentrons_hardware.hardware_control.tip_presence import (
    TipDetector,
    types as tp_types,
)
from opentrons_hardware.firmware_bindings.constants import SensorId
from opentrons_hardware.drivers.can_bus import CanMessenger

from opentrons_shared_data.errors.exceptions import UnmatchedTipPresenceStates


@pytest.fixture
def can_messenger(decoy: Decoy) -> CanMessenger:
    """Build a decoyed can messenger."""
    return decoy.mock(cls=CanMessenger)


@pytest.fixture
def tip_detector(decoy: Decoy) -> TipDetector:
    return decoy.mock(cls=TipDetector)


class TipDetectorController:
    def __init__(self, tip_detector: TipDetector, decoy: Decoy) -> None:
        self._tip_detector = tip_detector
        self._decoy = decoy

    async def retrieve_tip_status(self, tip_presence: bool) -> None:
        tip_notif = tp_types.TipNotification(sensor=SensorId.S0, presence=tip_presence)
        self._decoy.when(await self._tip_detector.request_tip_status()).then_return(
            [tip_notif]
        )

    async def retrieve_tip_status_highthroughput(
        self, tip_presences: Dict[SensorId, bool]
    ) -> None:
        tip_notif = [
            tp_types.TipNotification(sensor=sensor_id, presence=presence)
            for sensor_id, presence in tip_presences.items()
        ]
        self._decoy.when(await self._tip_detector.request_tip_status()).then_return(
            tip_notif
        )


@pytest.fixture
def tip_detector_controller(
    tip_detector: TipDetector,
    decoy: Decoy,
) -> TipDetectorController:
    return TipDetectorController(tip_detector, decoy)


@pytest.fixture
async def subject(
    can_messenger: CanMessenger,
    tip_detector: TipDetector,
) -> AsyncIterator[TipPresenceManager]:
    """Build a test subject using decoyed can messenger and tip detector."""
    manager = TipPresenceManager(can_messenger)
    manager.set_detector(OT3Mount.LEFT, tip_detector)
    try:
        yield manager
    finally:
        return


@pytest.mark.parametrize(
    "tip_presence,expected_type",
    [
        (False, TipStateType.ABSENT),
        (True, TipStateType.PRESENT),
    ],
)
async def test_get_tip_status_for_low_throughput(
    subject: TipPresenceManager,
    tip_detector_controller: TipDetectorController,
    tip_presence: bool,
    expected_type: TipStateType,
) -> None:
    mount = OT3Mount.LEFT
    await tip_detector_controller.retrieve_tip_status(tip_presence)

    result = await subject.get_tip_status(mount)
    result == expected_type


@pytest.mark.parametrize(
    "tip_presence,expected_type",
    [
        ({SensorId.S0: False, SensorId.S1: False}, TipStateType.ABSENT),
        ({SensorId.S0: True, SensorId.S1: True}, TipStateType.PRESENT),
    ],
)
async def test_get_tip_status_for_high_throughput(
    subject: TipPresenceManager,
    tip_detector_controller: TipDetectorController,
    tip_presence: Dict[SensorId, bool],
    expected_type: TipStateType,
) -> None:
    mount = OT3Mount.LEFT
    await tip_detector_controller.retrieve_tip_status_highthroughput(tip_presence)

    result = await subject.get_tip_status(mount)
    result == expected_type


@pytest.mark.parametrize(
    "tip_presence",
    [
        {SensorId.S0: True, SensorId.S1: False},
        {SensorId.S0: False, SensorId.S1: True},
    ],
)
async def test_unmatched_tip_responses_should_raise(
    subject: TipPresenceManager,
    tip_detector_controller: TipDetectorController,
    tip_presence: Dict[SensorId, bool],
) -> None:
    mount = OT3Mount.LEFT
    await tip_detector_controller.retrieve_tip_status_highthroughput(tip_presence)

    with pytest.raises(UnmatchedTipPresenceStates):
        await subject.get_tip_status(mount)
