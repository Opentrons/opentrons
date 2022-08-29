"""Tests for the ProtocolContext public interface."""
import inspect

import pytest
from decoy import Decoy, matchers

from opentrons.types import Mount, PipetteName
from opentrons.protocol_api import (
    MAX_SUPPORTED_VERSION,
    ProtocolContext,
    InstrumentContext,
    validation,
)

from opentrons.protocol_api.core.protocol import (
    AbstractProtocol as BaseAbstractProtocol,
)
from opentrons.protocol_api.core.instrument import (
    AbstractInstrument as BaseAbstractInstrument,
)
from opentrons.protocol_api.core.labware import AbstractLabware as BaseAbstractLabware
from opentrons.protocol_api.core.well import AbstractWellCore
from opentrons.protocol_api.core.labware_offset_provider import (
    AbstractLabwareOffsetProvider,
)

AbstractInstrument = BaseAbstractInstrument[AbstractWellCore]
AbstractLabware = BaseAbstractLabware[AbstractWellCore]
AbstractProtocol = BaseAbstractProtocol[AbstractInstrument, AbstractLabware]


@pytest.fixture(autouse=True)
def _mock_validation_module(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    for name, func in inspect.getmembers(validation, inspect.isfunction):
        monkeypatch.setattr(validation, name, decoy.mock(func=func))


@pytest.fixture
def mock_core(decoy: Decoy) -> AbstractProtocol:
    """Get a mock implementation core."""
    return decoy.mock(cls=AbstractProtocol)


@pytest.fixture
def mock_labware_offset_provider(decoy: Decoy) -> AbstractLabwareOffsetProvider:
    """Get a mock offset provider core."""
    return decoy.mock(cls=AbstractLabwareOffsetProvider)


@pytest.fixture
def subject(
    mock_core: AbstractProtocol,
    mock_labware_offset_provider: AbstractLabwareOffsetProvider,
) -> ProtocolContext:
    """Get a ProtocolContext test subject with its dependencies mocked out."""
    return ProtocolContext(
        api_version=MAX_SUPPORTED_VERSION,
        implementation=mock_core,
        labware_offset_provider=mock_labware_offset_provider,
    )


def test_load_instrument(
    decoy: Decoy,
    mock_core: AbstractProtocol,
    subject: ProtocolContext,
) -> None:
    """It should create a instrument using its execution core."""
    mock_instrument_core = decoy.mock(cls=AbstractInstrument)

    decoy.when(validation.ensure_mount("shadowfax")).then_return(Mount.LEFT)

    decoy.when(validation.ensure_pipette_name("gandalf")).then_return(PipetteName.P300_SINGLE)

    decoy.when(
        mock_core.load_instrument(
            instrument_name=PipetteName.P300_SINGLE,
            mount=Mount.LEFT,
        )
    ).then_return(mock_instrument_core)

    decoy.when(mock_instrument_core.get_pipette_name()).then_return("Gandalf the Grey")

    result = subject.load_instrument(
        instrument_name="gandalf",
        mount="shadowfax",
    )

    assert isinstance(result, InstrumentContext)
    assert result.name == "Gandalf the Grey"
    assert subject.loaded_instruments["left"] is result


def test_load_instrument_replace(
    decoy: Decoy, mock_core: AbstractProtocol, subject: ProtocolContext
) -> None:
    """It should allow/disallow pipette replacement."""
    mock_instrument_core = decoy.mock(cls=AbstractInstrument)

    decoy.when(validation.ensure_mount(matchers.IsA(Mount))).then_return(Mount.RIGHT)
    decoy.when(validation.ensure_pipette_name(matchers.IsA(str))).then_return(PipetteName.P300_SINGLE)
    decoy.when(
        mock_core.load_instrument(
            instrument_name=matchers.IsA(PipetteName),
            mount=matchers.IsA(Mount),
        )
    ).then_return(mock_instrument_core)
    decoy.when(mock_instrument_core.get_pipette_name()).then_return("Ada Lovelace")

    pipette_1 = subject.load_instrument(instrument_name="ada", mount=Mount.RIGHT)
    assert subject.loaded_instruments["right"] is pipette_1

    pipette_2 = subject.load_instrument(
        instrument_name="ada", mount=Mount.RIGHT, replace=True
    )
    assert subject.loaded_instruments["right"] is pipette_2

    with pytest.raises(RuntimeError, match="Instrument already present"):
        subject.load_instrument(instrument_name="ada", mount=Mount.RIGHT)
