"""Test instrument context simulation."""
import pytest
from pytest_lazyfixture import lazy_fixture  # type: ignore[import]

from opentrons.protocol_api.core.protocol import (
    AbstractProtocol as BaseAbstractProtocol,
)
from opentrons.protocol_api.core.labware import AbstractLabware as BaseAbstractLabware
from opentrons.protocol_api.core.instrument import (
    AbstractInstrument as BaseAbstractInstrument,
)
from opentrons.protocol_api.core.well import AbstractWellCore
from opentrons import types


AbstractInstrument = BaseAbstractInstrument[AbstractWellCore]
AbstractLabware = BaseAbstractLabware[AbstractWellCore]
AbstractProtocol = BaseAbstractProtocol[AbstractInstrument, AbstractLabware]


@pytest.fixture(
    params=[
        lazy_fixture("protocol_context"),
        lazy_fixture("simulating_protocol_context"),
    ]
)
def subject(request: pytest.FixtureRequest) -> AbstractProtocol:
    return request.param  # type: ignore[attr-defined, no-any-return]


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
    pip1 = subject.load_instrument(
        types.PipetteName.P300_SINGLE_GEN2, types.Mount.RIGHT
    )
    pip2 = subject.load_instrument(
        types.PipetteName.P300_SINGLE_GEN2, types.Mount.RIGHT
    )

    pip1.pick_up_tip(
        well=labware.get_wells()[0],
        tip_length=1,
        presses=None,
        increment=None,
        prep_after=False,
    )
    assert pip1.has_tip() is True
    assert pip2.has_tip() is True

    pip2.drop_tip(home_after=False)

    assert pip1.has_tip() is False
    assert pip2.has_tip() is False
