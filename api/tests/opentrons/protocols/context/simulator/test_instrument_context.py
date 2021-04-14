"""Test instrument context simulation."""
import pytest
from pytest_lazyfixture import lazy_fixture

from opentrons.hardware_control import NoTipAttachedError
from opentrons.hardware_control.types import TipAttachedError
from opentrons.protocols.context.labware import AbstractLabware
from opentrons.protocols.context.protocol_api.labware import \
    LabwareImplementation
from opentrons_shared_data.labware.dev_types import LabwareDefinition
from opentrons import types
from opentrons.protocols.context.instrument import AbstractInstrument
from opentrons.protocols.context.protocol_api.protocol_context import \
    ProtocolContextImplementation
from opentrons.protocols.context.simulator.instrument_context import \
    InstrumentContextSimulation


@pytest.fixture
def protocol_context() -> ProtocolContextImplementation:
    """Protocol context implementation fixture."""
    return ProtocolContextImplementation()


@pytest.fixture
def instrument_context(
        protocol_context: ProtocolContextImplementation) -> AbstractInstrument:
    """Instrument context backed by hardware simulator."""
    return protocol_context.load_instrument(
        'p300_single_gen2', types.Mount.RIGHT, replace=False
    )


@pytest.fixture
def simulating_context(protocol_context: ProtocolContextImplementation,
                       instrument_context: AbstractInstrument) -> AbstractInstrument:
    """A simulating instrument context."""
    return InstrumentContextSimulation(
        protocol_interface=protocol_context,
        pipette_dict=instrument_context.get_pipette(),
        mount=types.Mount.RIGHT, instrument_name='p300_single_gen2'
    )


@pytest.fixture
def labware(minimal_labware_def: LabwareDefinition) -> AbstractLabware:
    """Labware fixture."""
    return LabwareImplementation(
        definition=minimal_labware_def,
        parent=types.Location(types.Point(0, 0, 0), "1"),
    )


@pytest.fixture(params=[lazy_fixture("instrument_context"),
                        lazy_fixture("simulating_context")
                        ])
def subject(request) -> AbstractInstrument:
    return request.param


def test_same_pipette(instrument_context: AbstractInstrument,
                      simulating_context: AbstractInstrument) -> None:
    """It should have the same pipette as hardware backed instrument context."""
    assert instrument_context.get_pipette() == simulating_context.get_pipette()


def test_aspirate_no_tip(subject: AbstractInstrument) -> None:
    """It should raise an error if a tip is not attached."""
    with pytest.raises(NoTipAttachedError, match="Cannot perform ASPIRATE"):
        subject.aspirate(volume=1, rate=1)


def test_prepare_to_aspirate_no_tip(subject: AbstractInstrument) -> None:
    """It should raise an error if a tip is not attached."""
    with pytest.raises(NoTipAttachedError,
                       match="Cannot perform PREPARE_ASPIRATE"):
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


def test_pick_up_tip_no_tip(subject: AbstractInstrument,
                            labware: AbstractLabware) -> None:
    """It should raise an error if a tip is already attached."""
    subject.home()
    subject.pick_up_tip(well=labware.get_wells()[0], tip_length=1, presses=None,
                        increment=None)
    with pytest.raises(TipAttachedError):
        subject.pick_up_tip(well=labware.get_wells()[0], tip_length=1,
                            presses=None,
                            increment=None)


def test_aspirate_too_much(subject: AbstractInstrument,
                           labware: AbstractLabware) -> None:
    """It should raise an error if try to aspirate more than possible."""
    subject.home()
    subject.pick_up_tip(well=labware.get_wells()[0], tip_length=1, presses=None,
                        increment=None)
    subject.prepare_for_aspirate()
    with pytest.raises(AssertionError,
                       match="Cannot aspirate more than pipette max volume"):
        subject.aspirate(subject.get_max_volume() + 1, rate=1)
