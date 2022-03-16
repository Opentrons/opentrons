"""Test instrument context simulation."""
import pytest
from pytest_lazyfixture import lazy_fixture

from opentrons.hardware_control import NoTipAttachedError
from opentrons.hardware_control.types import TipAttachedError
from opentrons.protocols.context.labware import AbstractLabware
from opentrons.protocols.context.instrument import AbstractInstrument


@pytest.fixture(
    params=[
        lazy_fixture("instrument_context"),
        lazy_fixture("simulating_instrument_context"),
    ]
)
def subject(request) -> AbstractInstrument:
    return request.param


def test_same_pipette(
    instrument_context: AbstractInstrument,
    simulating_instrument_context: AbstractInstrument,
) -> None:
    """It should have the same pipette as hardware backed instrument context."""
    assert (
        instrument_context.get_pipette() == simulating_instrument_context.get_pipette()
    )


def test_aspirate_no_tip(subject: AbstractInstrument) -> None:
    """It should raise an error if a tip is not attached."""
    with pytest.raises(NoTipAttachedError, match="Cannot perform ASPIRATE"):
        subject.aspirate(volume=1, rate=1)


def test_prepare_to_aspirate_no_tip(subject: AbstractInstrument) -> None:
    """It should raise an error if a tip is not attached."""
    with pytest.raises(NoTipAttachedError, match="Cannot perform PREPARE_ASPIRATE"):
        subject.prepare_for_aspirate()


def test_dispense_no_tip(subject: AbstractInstrument) -> None:
    """It should raise an error if a tip is not attached."""
    with pytest.raises(NoTipAttachedError, match="Cannot perform DISPENSE"):
        subject.dispense(volume=1, rate=1)


def test_drop_tip_no_tip(subject: AbstractInstrument) -> None:
    """It should raise an error if a tip is not attached."""
    with pytest.raises(NoTipAttachedError, match="Cannot perform DROPTIP"):
        subject.drop_tip(home_after=False)


def test_blow_out_no_tip(subject: AbstractInstrument) -> None:
    """It should raise an error if a tip is not attached."""
    with pytest.raises(NoTipAttachedError, match="Cannot perform BLOWOUT"):
        subject.blow_out()


def test_pick_up_tip_no_tip(
    subject: AbstractInstrument, labware: AbstractLabware
) -> None:
    """It should raise an error if a tip is already attached."""
    subject.home()
    subject.pick_up_tip(
        well=labware.get_wells()[0], tip_length=1, presses=None, increment=None
    )
    with pytest.raises(TipAttachedError):
        subject.pick_up_tip(
            well=labware.get_wells()[0], tip_length=1, presses=None, increment=None
        )


def test_aspirate_too_much(
    subject: AbstractInstrument, labware: AbstractLabware
) -> None:
    """It should raise an error if try to aspirate more than possible."""
    subject.home()
    subject.pick_up_tip(
        well=labware.get_wells()[0], tip_length=1, presses=None, increment=None
    )
    subject.prepare_for_aspirate()
    with pytest.raises(
        AssertionError, match="Cannot aspirate more than pipette max volume"
    ):
        subject.aspirate(subject.get_max_volume() + 1, rate=1)
