"""Test setStatusBar commands."""

import pytest
from decoy import Decoy

from opentrons.protocol_engine.commands.set_status_bar import (
    SetStatusBarParams,
    SetStatusBarResult,
    SetStatusBarImplementation,
    StatusBarAnimation,
)

from opentrons.hardware_control.types import StatusBarState
from opentrons.protocol_engine.execution.status_bar import StatusBarHandler


@pytest.fixture
def subject(
    status_bar: StatusBarHandler,
) -> SetStatusBarImplementation:
    """Returns subject under test."""
    return SetStatusBarImplementation(status_bar=status_bar)


async def test_status_bar_busy(
    decoy: Decoy,
    status_bar: StatusBarHandler,
    subject: SetStatusBarImplementation,
) -> None:
    """Test when the status bar is busy."""
    decoy.when(status_bar.status_bar_should_not_be_changed()).then_return(True)

    data = SetStatusBarParams(animation=StatusBarAnimation.OFF)

    result = await subject.execute(params=data)

    assert result == SetStatusBarResult()

    decoy.verify(await status_bar.set_status_bar(status=StatusBarState.OFF), times=0)


@pytest.mark.parametrize(
    argnames=["animation", "expected_state"],
    argvalues=[
        [StatusBarAnimation.CONFIRM, StatusBarState.CONFIRMATION],
        [StatusBarAnimation.DISCO, StatusBarState.DISCO],
        [StatusBarAnimation.OFF, StatusBarState.OFF],
        [StatusBarAnimation.IDLE, StatusBarState.IDLE],
        [StatusBarAnimation.UPDATING, StatusBarState.UPDATING],
    ],
)
async def test_set_status_bar_animation(
    decoy: Decoy,
    status_bar: StatusBarHandler,
    subject: SetStatusBarImplementation,
    animation: StatusBarAnimation,
    expected_state: StatusBarState,
) -> None:
    """Test when status bar is NOT busy."""
    decoy.when(status_bar.status_bar_should_not_be_changed()).then_return(False)

    data = SetStatusBarParams(animation=animation)

    result = await subject.execute(params=data)
    assert result == SetStatusBarResult()

    decoy.verify(await status_bar.set_status_bar(status=expected_state), times=1)
