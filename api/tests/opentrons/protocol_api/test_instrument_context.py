"""Tests for the InstrumentContext public interface."""
import inspect
import pytest
from decoy import Decoy
from typing import cast

from opentrons.broker import Broker
from opentrons.commands import publisher as mock_publisher, commands
from opentrons.types import Location, Point, Mount

from opentrons.hardware_control.dev_types import PipetteDict

from opentrons.protocol_api import (
    MAX_SUPPORTED_VERSION,
    ProtocolContext,
    InstrumentContext,
    Well,
)

from opentrons.protocol_api.core.instrument import (
    AbstractInstrument as BaseAbstractInstrument,
)
from opentrons.protocol_api.core.well import AbstractWellCore


AbstractInstrument = BaseAbstractInstrument[AbstractWellCore]


@pytest.fixture(autouse=True)
def _mock_publisher_module(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    for name, func in inspect.getmembers(mock_publisher, inspect.isfunction):
        monkeypatch.setattr(mock_publisher, name, decoy.mock(func=func))


@pytest.fixture
def mock_implementation(decoy: Decoy) -> AbstractInstrument:
    """Get a mock instrument implementation."""
    return decoy.mock(cls=AbstractInstrument)


@pytest.fixture
def mock_protocol_context(decoy: Decoy) -> ProtocolContext:
    """Get a mock protocol context."""
    return decoy.mock(cls=ProtocolContext)


@pytest.fixture
def mock_broker(decoy: Decoy) -> Broker:
    """Get a mock protocol context."""
    return decoy.mock(cls=Broker)


@pytest.fixture
def mock_well(decoy: Decoy) -> Well:
    """Get a mock well."""
    return decoy.mock(cls=Well)


@pytest.fixture
def subject(
    mock_implementation: AbstractInstrument,
    mock_protocol_context: ProtocolContext,
    mock_broker: Broker,
) -> InstrumentContext:
    """Get a InstrumentContext test subject with its dependencies mocked out."""
    return InstrumentContext(
        implementation=mock_implementation,
        ctx=mock_protocol_context,
        broker=mock_broker,
        at_version=MAX_SUPPORTED_VERSION,
    )


def test_move_to(
    decoy: Decoy,
    mock_broker: Broker,
    mock_implementation: AbstractInstrument,
    mock_protocol_context: ProtocolContext,
    mock_well: Well,
    subject: InstrumentContext,
) -> None:
    """It should move an instrument to a well."""
    decoy.when(mock_implementation.get_pipette()).then_return(
        cast(PipetteDict, {"display_name": "my cool pipette"})
    )
    decoy.when(mock_implementation.get_mount()).then_return(Mount.LEFT)
    decoy.when(mock_protocol_context._modules).then_return([])

    mock_context = decoy.mock(name="mock-context")

    decoy.when(
        mock_publisher.publish_context(
            broker=mock_broker,
            command=commands.move_to(
                instrument=subject,
                location=Location(point=Point(1, 2, 3), labware=mock_well),
            ),
        )
    ).then_return(mock_context)

    result = subject.move_to(Location(point=Point(1, 2, 3), labware=mock_well))

    assert isinstance(result, InstrumentContext)
    decoy.verify(
        mock_context.__enter__(),
        mock_implementation.move_to(
            location=Location(point=Point(1, 2, 3), labware=mock_well),
            force_direct=False,
            minimum_z_height=None,
            speed=None,
        ),
        mock_context.__exit__(None, None, None),
    )
