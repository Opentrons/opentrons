"""Tests for the InstrumentContext public interface."""
from typing import cast

import pytest
from decoy import Decoy

from opentrons.broker import Broker
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_api import (
    MAX_SUPPORTED_VERSION,
    ProtocolContext,
    InstrumentContext,
    Labware,
    Well,
)
from opentrons.protocol_api.core.common import InstrumentCore
from opentrons.types import Location, Mount, Point


@pytest.fixture
def mock_instrument_core(decoy: Decoy) -> InstrumentCore:
    """Get a mock instrument implementation core."""
    instrument_core = decoy.mock(cls=InstrumentCore)
    decoy.when(instrument_core.get_mount()).then_return(Mount.LEFT)
    decoy.when(instrument_core.get_hardware_state()).then_return(
        cast(PipetteDict, {"display_name": "Cool Pipette"})
    )
    return instrument_core


# TODO(mc, 2022-10-25): this will be replaced by a protocol core, instead
@pytest.fixture
def mock_protocol_context(decoy: Decoy) -> ProtocolContext:
    """Get a mock ProtocolContext."""
    return decoy.mock(cls=ProtocolContext)


@pytest.fixture
def mock_broker(decoy: Decoy) -> Broker:
    """Get a mock command message broker."""
    return decoy.mock(cls=Broker)


@pytest.fixture
def mock_trash(decoy: Decoy) -> Broker:
    """Get a mock fixed-trash labware."""
    return decoy.mock(cls=Broker)


@pytest.fixture
def api_version() -> APIVersion:
    """Get the API version to test at."""
    return MAX_SUPPORTED_VERSION


@pytest.fixture
def subject(
    mock_instrument_core: InstrumentCore,
    mock_protocol_context: ProtocolContext,
    mock_broker: Broker,
    mock_trash: Labware,
    api_version: APIVersion,
) -> InstrumentContext:
    """Get a ProtocolContext test subject with its dependencies mocked out."""
    return InstrumentContext(
        implementation=mock_instrument_core,
        ctx=mock_protocol_context,
        broker=mock_broker,
        api_version=api_version,
        tip_racks=[],
        trash=mock_trash,
        requested_as="requested-pipette-name",
    )


@pytest.mark.parametrize("api_version", [APIVersion(2, 0), APIVersion(2, 1)])
def test_api_version(api_version: APIVersion, subject: InstrumentContext) -> None:
    """It should have an api_version property."""
    assert subject.api_version == api_version


def test_trash_container(
    decoy: Decoy,
    mock_trash: Labware,
    subject: InstrumentContext,
) -> None:
    """It should have a settable trash_container property."""
    assert subject.trash_container is mock_trash

    other_trash = decoy.mock(cls=Labware)
    subject.trash_container = other_trash

    assert subject.trash_container is other_trash


def test_tip_racks(decoy: Decoy, subject: InstrumentContext) -> None:
    """It should have a settable tip_racks property."""
    assert subject.tip_racks == []

    tip_racks = [decoy.mock(cls=Labware), decoy.mock(cls=Labware)]
    subject.tip_racks = tip_racks

    assert subject.tip_racks == tip_racks


def test_mount(
    decoy: Decoy, mock_instrument_core: InstrumentCore, subject: InstrumentContext
) -> None:
    """It should have a mount property."""
    decoy.when(mock_instrument_core.get_mount()).then_return(Mount.RIGHT)

    assert subject.mount == "right"


def test_move_to(
    decoy: Decoy, mock_instrument_core: InstrumentCore, subject: InstrumentContext
) -> None:
    """It should move the pipette to a location."""
    location = Location(point=Point(1, 2, 3), labware=None)

    subject.move_to(location)

    decoy.verify(
        mock_instrument_core.move_to(
            well_core=None,
            location=location,
            force_direct=False,
            minimum_z_height=None,
            speed=None,
        ),
        times=1,
    )


def test_move_to_well(
    decoy: Decoy, mock_instrument_core: InstrumentCore, subject: InstrumentContext
) -> None:
    """It should move the pipette to a location."""
    mock_well = decoy.mock(cls=Well)
    location = Location(point=Point(1, 2, 3), labware=mock_well)

    subject.move_to(location)

    decoy.verify(
        mock_instrument_core.move_to(
            location=location,
            well_core=mock_well._impl,
            force_direct=False,
            minimum_z_height=None,
            speed=None,
        ),
        times=1,
    )
