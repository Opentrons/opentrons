"""Test instrument context simulation."""
import pytest
from opentrons.protocols.context.protocol import AbstractProtocol
from pytest_lazyfixture import lazy_fixture

from opentrons.protocols.context.labware import AbstractLabware
from opentrons import types


@pytest.fixture(
    params=[
        lazy_fixture("protocol_context"),
        lazy_fixture("simulating_protocol_context"),
    ]
)
def subject(request) -> AbstractProtocol:
    return request.param


def test_load_instrument_fails_when_present(subject: AbstractProtocol) -> None:
    """It should fail if already present."""
    subject.load_instrument("p300_single_gen2", types.Mount.RIGHT, replace=False)
    with pytest.raises(RuntimeError):
        subject.load_instrument("p300_single_gen2", types.Mount.RIGHT, replace=False)


def test_replacing_instrument_tip_state(
    subject: AbstractProtocol, labware: AbstractLabware
) -> None:
    """It should refer to same state when replacing the same pipette."""
    # This test validates that bug https://github.com/Opentrons/opentrons/issues/8273
    # is fixed. The user who found this calls load_instrument repeatedly with same name,
    # mount, and replace=True. The resulting InstrumentContext references are used
    # interchangeably causing fast simulation to fail due to the pipette state being
    # attached to the InstrumentContextSimulation object.
    # The solution is to reuse InstrumentContextSimulation instances when the user is
    # replacing the same pipette at the same mount.
    subject.home()
    pip1 = subject.load_instrument("p300_single_gen2", types.Mount.RIGHT, replace=False)
    pip2 = subject.load_instrument("p300_single_gen2", types.Mount.RIGHT, replace=True)

    pip1.pick_up_tip(
        well=labware.get_wells()[0], tip_length=1, presses=None, increment=None
    )
    assert pip1.has_tip() is True
    assert pip2.has_tip() is True

    pip2.drop_tip(home_after=False)

    assert pip1.has_tip() is False
    assert pip2.has_tip() is False
