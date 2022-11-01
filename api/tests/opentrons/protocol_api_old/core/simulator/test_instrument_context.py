"""Test instrument context simulation."""
from typing import Callable

import pytest
from pytest_lazyfixture import lazy_fixture  # type: ignore[import]

from opentrons.hardware_control import NoTipAttachedError
from opentrons.hardware_control.types import TipAttachedError
from opentrons.protocol_api.core.common import InstrumentCore, LabwareCore


@pytest.fixture(
    params=[
        lazy_fixture("instrument_context"),
        lazy_fixture("simulating_instrument_context"),
    ]
)
def subject(request: pytest.FixtureRequest) -> InstrumentCore:
    return request.param  # type: ignore[attr-defined, no-any-return]


def test_same_pipette(
    instrument_context: InstrumentCore,
    simulating_instrument_context: InstrumentCore,
) -> None:
    """It should have the same pipette as hardware backed instrument context."""
    assert (
        instrument_context.get_hardware_state()
        == simulating_instrument_context.get_hardware_state()
    )


def test_aspirate_no_tip(subject: InstrumentCore) -> None:
    """It should raise an error if a tip is not attached."""
    with pytest.raises(NoTipAttachedError, match="Cannot perform ASPIRATE"):
        subject.aspirate(volume=1, rate=1)


def test_prepare_to_aspirate_no_tip(subject: InstrumentCore) -> None:
    """It should raise an error if a tip is not attached."""
    with pytest.raises(NoTipAttachedError, match="Cannot perform PREPARE_ASPIRATE"):
        subject.prepare_for_aspirate()


def test_dispense_no_tip(subject: InstrumentCore) -> None:
    """It should raise an error if a tip is not attached."""
    with pytest.raises(NoTipAttachedError, match="Cannot perform DISPENSE"):
        subject.dispense(volume=1, rate=1)


def test_drop_tip_no_tip(subject: InstrumentCore) -> None:
    """It should raise an error if a tip is not attached."""
    with pytest.raises(NoTipAttachedError, match="Cannot perform DROPTIP"):
        subject.drop_tip(home_after=False)


def test_blow_out_no_tip(subject: InstrumentCore) -> None:
    """It should raise an error if a tip is not attached."""
    with pytest.raises(NoTipAttachedError, match="Cannot perform BLOWOUT"):
        subject.blow_out()


def test_pick_up_tip_no_tip(subject: InstrumentCore, labware: LabwareCore) -> None:
    """It should raise an error if a tip is already attached."""
    subject.home()
    subject.pick_up_tip(
        well=labware.get_wells()[0],
        tip_length=1,
        presses=None,
        increment=None,
        prep_after=False,
    )
    with pytest.raises(TipAttachedError):
        subject.pick_up_tip(
            well=labware.get_wells()[0],
            tip_length=1,
            presses=None,
            increment=None,
            prep_after=False,
        )


def test_pick_up_tip_prep_after(subject: InstrumentCore, labware: LabwareCore) -> None:
    """It should not raise an error, regardless of prep_after value."""
    subject.home()
    subject.pick_up_tip(
        well=labware.get_wells()[0],
        tip_length=1,
        presses=None,
        increment=None,
        prep_after=True,
    )
    subject.aspirate(1, rate=1)
    subject.dispense(1, rate=1)
    subject.drop_tip(home_after=True)
    # and again, without preparing for aspirate
    subject.pick_up_tip(
        well=labware.get_wells()[0],
        tip_length=1,
        presses=None,
        increment=None,
        prep_after=False,
    )
    subject.aspirate(1, rate=1)
    subject.dispense(1, rate=1)
    subject.drop_tip(home_after=True)


def test_aspirate_too_much(subject: InstrumentCore, labware: LabwareCore) -> None:
    """It should raise an error if try to aspirate more than possible."""
    subject.home()
    subject.pick_up_tip(
        well=labware.get_wells()[0],
        tip_length=1,
        presses=None,
        increment=None,
        prep_after=False,
    )
    subject.prepare_for_aspirate()
    with pytest.raises(
        AssertionError, match="Cannot aspirate more than pipette max volume"
    ):
        subject.aspirate(subject.get_max_volume() + 1, rate=1)


def test_working_volume(subject: InstrumentCore, labware: LabwareCore) -> None:
    """It should have the correct working volume."""
    subject.home()
    assert subject.get_hardware_state()["working_volume"] == 300
    subject.pick_up_tip(
        well=labware.get_wells()[0],
        tip_length=1,
        presses=None,
        increment=None,
        prep_after=False,
    )
    assert subject.get_hardware_state()["working_volume"] == 100


@pytest.mark.parametrize(
    argnames=["side_effector"],
    argvalues=[
        [lambda i: None],
        [lambda i: i.set_flow_rate(aspirate=212, dispense=44, blow_out=22)],
        [lambda i: i.set_pipette_speed(aspirate=212, dispense=44, blow_out=22)],
    ],
)
def test_pipette_dict(
    side_effector: Callable[[InstrumentCore], None],
    instrument_context: InstrumentCore,
    simulating_instrument_context: InstrumentCore,
) -> None:
    """It should be the same."""
    side_effector(instrument_context)
    side_effector(simulating_instrument_context)
    assert (
        instrument_context.get_hardware_state()
        == simulating_instrument_context.get_hardware_state()
    )


def _aspirate(i: InstrumentCore) -> None:
    """pipette dict with tip fixture."""
    i.prepare_for_aspirate()
    i.aspirate(12, 10)


def _aspirate_dispense(i: InstrumentCore) -> None:
    """pipette dict with tip fixture."""
    i.prepare_for_aspirate()
    i.aspirate(12, 10)
    i.dispense(2, 2)


def _aspirate_blowout(i: InstrumentCore) -> None:
    """pipette dict with tip fixture."""
    i.prepare_for_aspirate()
    i.aspirate(11, 13)
    i.blow_out()


@pytest.mark.parametrize(
    argnames=["side_effector"],
    argvalues=[
        [lambda i: None],
        [_aspirate],
        [_aspirate_dispense],
        [_aspirate_blowout],
    ],
)
def test_pipette_dict_with_tip(
    side_effector: Callable[[InstrumentCore], None],
    instrument_context: InstrumentCore,
    simulating_instrument_context: InstrumentCore,
    labware: LabwareCore,
) -> None:
    """It should be the same."""
    # Home first
    instrument_context.home()
    simulating_instrument_context.home()
    # Pickup tip
    instrument_context.pick_up_tip(
        well=labware.get_wells()[0],
        tip_length=2,
        presses=3,
        increment=4,
        prep_after=False,
    )
    simulating_instrument_context.pick_up_tip(
        well=labware.get_wells()[0],
        tip_length=2,
        presses=3,
        increment=4,
        prep_after=False,
    )

    side_effector(instrument_context)
    side_effector(simulating_instrument_context)
    assert (
        instrument_context.get_hardware_state()
        == simulating_instrument_context.get_hardware_state()
    )

    # Drop tip and compare again
    instrument_context.drop_tip(home_after=False)
    simulating_instrument_context.drop_tip(home_after=False)

    assert (
        instrument_context.get_hardware_state()
        == simulating_instrument_context.get_hardware_state()
    )
