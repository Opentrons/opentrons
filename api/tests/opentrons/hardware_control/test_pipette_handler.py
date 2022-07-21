"""Tests for the HardwareApi class."""
import pytest
import asyncio

from decoy import Decoy
from typing import Dict, Optional

from opentrons import types
from opentrons.hardware_control.instruments.pipette import Pipette
from opentrons.hardware_control.instruments.pipette_handler import PipetteHandlerProvider
from opentrons.hardware_control.backends import Controller
from opentrons.config.types import RobotConfig


@pytest.fixture
def subject(
    decoy: Decoy
) -> PipetteHandlerProvider:
    inst_by_mount = {types.MountType.LEFT, decoy.mock(cls=Pipette)}
    subject = PipetteHandlerProvider(attached_instruments=inst_by_mount)

    return subject


async def test_plan_check_pick_up_tip_with_presses_0(decoy: Decoy, subject: PipetteHandlerProvider) -> None:
    """Should return an array with 0 length."""
    tip_length = 25.0
    mount = types.Mount.LEFT
    presses = 0
    increment = None

    # decoy.when(subject.get_pipette(mount)).then_return(decoy.mock(cls=Pipette))
    await subject.plan_check_pick_up_tip(mount, tip_length, presses, increment)



