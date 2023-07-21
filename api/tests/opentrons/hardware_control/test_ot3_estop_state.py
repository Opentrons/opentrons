import pytest
from decoy import Decoy
from typing import List, Tuple, Optional

from opentrons.hardware_control.estop_state import EstopStateMachine
from opentrons_hardware.hardware_control.estop.detector import (
    EstopSummary,
    EstopDetector,
)
from opentrons.hardware_control.types import (
    EstopState,
    EstopPhysicalStatus,
    EstopAttachLocation,
    EstopStateNotification,
    HardwareEvent,
)


@pytest.mark.ot3_only
@pytest.fixture
def initial_state() -> "EstopSummary":
    return EstopSummary(left_detected=True, right_detected=True, engaged=False)


@pytest.mark.ot3_only
@pytest.fixture
def mock_estop_detector(decoy: Decoy, initial_state: "EstopSummary") -> "EstopDetector":
    """Create a mocked estop detector."""
    mock = decoy.mock(cls=EstopDetector)
    decoy.when(mock.status).then_return(initial_state)
    return mock


@pytest.mark.ot3_only
@pytest.fixture
def subject(mock_estop_detector: "EstopDetector") -> "EstopStateMachine":
    return EstopStateMachine(detector=mock_estop_detector)


@pytest.mark.ot3_only
async def test_estop_state_no_detector(
    mock_estop_detector: "EstopDetector", decoy: Decoy
) -> None:
    """Test that the estop state machine works without a detector."""
    subject = EstopStateMachine(detector=None)
    assert subject.state == EstopState.DISENGAGED
    assert (
        subject.get_physical_status(EstopAttachLocation.LEFT)
        == EstopPhysicalStatus.DISENGAGED
    )
    assert (
        subject.get_physical_status(EstopAttachLocation.RIGHT)
        == EstopPhysicalStatus.DISENGAGED
    )

    decoy.when(mock_estop_detector.status).then_return(
        EstopSummary(left_detected=False, right_detected=True, engaged=True)
    )

    subject.subscribe_to_detector(detector=mock_estop_detector)

    assert subject.state == EstopState.PHYSICALLY_ENGAGED
    assert (
        subject.get_physical_status(EstopAttachLocation.LEFT)
        == EstopPhysicalStatus.NOT_PRESENT
    )
    assert (
        subject.get_physical_status(EstopAttachLocation.RIGHT)
        == EstopPhysicalStatus.ENGAGED
    )

    # Check that adding a second listener will wipe out the first one
    subject.subscribe_to_detector(detector=mock_estop_detector)

    decoy.verify(
        [
            mock_estop_detector.add_listener(subject.detector_listener),
            mock_estop_detector.remove_listener(subject.detector_listener),
            mock_estop_detector.add_listener(subject.detector_listener),
        ]
    )


@pytest.mark.ot3_only
async def test_estop_state_listener(
    subject: "EstopStateMachine", mock_estop_detector: "EstopDetector", decoy: Decoy
) -> None:
    """Test that the state machine broadcasts to listeners."""
    decoy.verify(mock_estop_detector.add_listener(subject.detector_listener))

    events: List[EstopStateNotification] = []

    def mock_listener(event: HardwareEvent) -> None:
        assert isinstance(event, EstopStateNotification)
        events.append(event)

    subject.add_listener(mock_listener)

    steps: List[Tuple[EstopSummary, EstopState]] = [
        (
            EstopSummary(left_detected=False, right_detected=False, engaged=False),
            EstopState.NOT_PRESENT,
        ),
        (
            EstopSummary(left_detected=True, right_detected=False, engaged=False),
            EstopState.DISENGAGED,
        ),
        (
            EstopSummary(left_detected=True, right_detected=False, engaged=True),
            EstopState.PHYSICALLY_ENGAGED,
        ),
    ]

    prev: Optional[EstopState] = None
    for (input, result) in steps:
        subject.detector_listener(summary=input)
        assert len(events) == 1
        event = events.pop(0)
        assert event.new_state == result
        assert event.new_state == subject.state
        if prev is not None:
            assert event.old_state == prev
        prev = event.new_state

    # Don't transmit event if nothing changed here
    assert subject.acknowledge_and_clear() == EstopState.PHYSICALLY_ENGAGED
    assert len(events) == 0

    # Now unsubscribe, change state, and assert we didn't get a callback
    subject.remove_listener(mock_listener)

    subject.detector_listener(
        summary=EstopSummary(left_detected=True, right_detected=True, engaged=False)
    )
    assert subject.state == EstopState.LOGICALLY_ENGAGED
    assert len(events) == 0

    subject.add_listener(mock_listener)
    assert subject.acknowledge_and_clear() == EstopState.DISENGAGED
    assert len(events) == 1
    assert events.pop().new_state == EstopState.DISENGAGED


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    argnames=["left_connected", "right_connected"],
    argvalues=[
        [False, False],
        [True, False],
        [False, True],
        [True, True],
    ],
)
async def test_estop_physical_status(
    subject: "EstopStateMachine", left_connected: bool, right_connected: bool
) -> None:
    """Test that physical status maps to expected"""
    summary = EstopSummary(
        left_detected=left_connected, right_detected=right_connected, engaged=False
    )
    subject.detector_listener(summary=summary)
    assert (
        subject.get_physical_status(location=EstopAttachLocation.LEFT)
        == EstopPhysicalStatus.DISENGAGED
        if left_connected
        else EstopPhysicalStatus.NOT_PRESENT
    )
    assert (
        subject.get_physical_status(location=EstopAttachLocation.RIGHT)
        == EstopPhysicalStatus.DISENGAGED
        if right_connected
        else EstopPhysicalStatus.NOT_PRESENT
    )

    summary.engaged = True
    subject.detector_listener(summary=summary)
    assert (
        subject.get_physical_status(location=EstopAttachLocation.LEFT)
        == EstopPhysicalStatus.ENGAGED
        if left_connected
        else EstopPhysicalStatus.NOT_PRESENT
    )
    assert (
        subject.get_physical_status(location=EstopAttachLocation.RIGHT)
        == EstopPhysicalStatus.ENGAGED
        if right_connected
        else EstopPhysicalStatus.NOT_PRESENT
    )


@pytest.mark.ot3_only
@pytest.mark.parametrize("clear_to_disengaged", [True, False])
async def test_estop_state_machine(
    subject: "EstopStateMachine", clear_to_disengaged: bool
) -> None:
    """Test traversal through the state machine."""

    steps: List[Tuple[EstopSummary, EstopState]] = [
        (
            EstopSummary(left_detected=False, right_detected=False, engaged=False),
            EstopState.NOT_PRESENT,
        ),
        (
            EstopSummary(left_detected=True, right_detected=False, engaged=False),
            EstopState.DISENGAGED,
        ),
        (
            EstopSummary(left_detected=True, right_detected=True, engaged=False),
            EstopState.DISENGAGED,
        ),
        (
            EstopSummary(left_detected=False, right_detected=False, engaged=False),
            EstopState.NOT_PRESENT,
        ),
        (
            EstopSummary(left_detected=True, right_detected=True, engaged=False),
            EstopState.DISENGAGED,
        ),
        (
            EstopSummary(left_detected=True, right_detected=True, engaged=True),
            EstopState.PHYSICALLY_ENGAGED,
        ),
        (
            EstopSummary(left_detected=True, right_detected=True, engaged=False),
            EstopState.LOGICALLY_ENGAGED,
        ),
        (
            EstopSummary(left_detected=True, right_detected=False, engaged=True),
            EstopState.PHYSICALLY_ENGAGED,
        ),
        (
            EstopSummary(left_detected=True, right_detected=False, engaged=False),
            EstopState.LOGICALLY_ENGAGED,
        ),
        (
            EstopSummary(
                left_detected=False, right_detected=clear_to_disengaged, engaged=False
            ),
            EstopState.LOGICALLY_ENGAGED,
        ),
    ]

    for (input, result) in steps:
        subject.detector_listener(input)
        assert subject.state == result

    assert (
        subject.acknowledge_and_clear() == EstopState.DISENGAGED
        if clear_to_disengaged
        else EstopState.NOT_PRESENT
    )
