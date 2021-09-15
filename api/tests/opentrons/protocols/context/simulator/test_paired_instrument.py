"""Test paired instrument simulation."""
import pytest
from unittest.mock import MagicMock

from opentrons.protocol_api import ProtocolContext
from opentrons.protocol_api.labware import Well, Labware
from opentrons.protocols.context.instrument import AbstractInstrument
from opentrons.protocols.context.paired_instrument import AbstractPairedInstrument
from opentrons.protocols.context.protocol_api.protocol_context import (
    ProtocolContextImplementation,
)
from opentrons.types import Location, Point
from pytest_lazyfixture import lazy_fixture

from opentrons.hardware_control import NoTipAttachedError
from opentrons.hardware_control.types import TipAttachedError
from opentrons.protocols.context.labware import AbstractLabware


@pytest.fixture(
    params=[
        lazy_fixture("paired_instrument"),
        lazy_fixture("simulating_paired_instrument"),
    ]
)
def subject(request) -> AbstractPairedInstrument:
    return request.param


def test_aspirate_no_tip(
    subject: AbstractPairedInstrument, labware: AbstractLabware
) -> None:
    """It should raise an error if a tip is not attached."""
    with pytest.raises(
        NoTipAttachedError, match="Cannot perform .+ without a tip attached"
    ):
        loc = Location(Point(0, 0, 0), Well(labware.get_wells()[0]))
        subject.aspirate(location=loc, volume=1, rate=1)


def test_dispense_no_tip(
    subject: AbstractPairedInstrument, labware: AbstractLabware
) -> None:
    """It should raise an error if a tip is not attached."""
    with pytest.raises(NoTipAttachedError, match="Cannot perform DISPENSE"):
        loc = Location(Point(0, 0, 0), Well(labware.get_wells()[0]))
        subject.dispense(location=loc, volume=1, rate=1)


def test_drop_tip_no_tip(
    subject: AbstractPairedInstrument, labware: AbstractLabware
) -> None:
    """It should raise an error if a tip is not attached."""
    with pytest.raises(NoTipAttachedError, match="Cannot perform DROPTIP"):
        loc = Location(Point(0, 0, 0), Labware(labware))
        subject.drop_tip(target=loc, home_after=False)


def test_blow_out_no_tip(
    subject: AbstractPairedInstrument, labware: AbstractLabware
) -> None:
    """It should raise an error if a tip is not attached."""
    with pytest.raises(NoTipAttachedError, match="Cannot perform BLOWOUT"):
        loc = Location(Point(0, 0, 0), Well(labware.get_wells()[0]))
        subject.blow_out(location=loc)


def test_pick_up_tip_no_tip(
    subject: AbstractPairedInstrument, labware: AbstractLabware
) -> None:
    """It should raise an error if a tip is already attached."""
    mock_tip_rack = MagicMock()
    subject.pick_up_tip(
        target=Well(labware.get_wells()[0]),
        secondary_target=Well(labware.get_wells()[1]),
        tip_length=1,
        presses=None,
        increment=None,
        tiprack=mock_tip_rack,
    )
    with pytest.raises(TipAttachedError):
        subject.pick_up_tip(
            target=Well(labware.get_wells()[0]),
            secondary_target=Well(labware.get_wells()[1]),
            tip_length=1,
            presses=None,
            increment=None,
            tiprack=mock_tip_rack,
        )


def test_aspirate_too_much(
    subject: AbstractPairedInstrument,
    labware: AbstractLabware,
    instrument_context: AbstractInstrument,
) -> None:
    """It should raise an error if try to aspirate more than possible."""
    mock_tip_rack = MagicMock()
    subject.pick_up_tip(
        target=Well(labware.get_wells()[0]),
        secondary_target=Well(labware.get_wells()[1]),
        tip_length=1,
        presses=None,
        increment=None,
        tiprack=mock_tip_rack,
    )
    with pytest.raises(
        AssertionError, match="Cannot aspirate more than pipette max volume"
    ):
        loc = Location(Point(0, 0, 0), Well(labware.get_wells()[0]))
        subject.aspirate(
            location=loc, volume=instrument_context.get_max_volume() + 1, rate=1
        )


def test_unsafe_thermocycler_move(
    subject: AbstractPairedInstrument,
    protocol_context: ProtocolContextImplementation,
) -> None:
    """It should raise an error due to an unsafe move."""
    ctx = ProtocolContext(implementation=protocol_context)
    m = ctx.load_module("thermocycler", configuration="semi", location="7")
    tc_labware = m.load_labware("nest_96_wellplate_100ul_pcr_full_skirt")
    m.close_lid()

    with pytest.raises(
        RuntimeError, match="Cannot move to labware loaded in Thermocycler"
    ):
        subject.move_to(location=Location(Point(0, 0, 0), tc_labware))
