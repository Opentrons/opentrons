"""Tests for Protocol API module contexts."""
from typing import Any, cast

import pytest
from decoy import Decoy

from opentrons_shared_data.labware.dev_types import LabwareDefinition as LabwareDefDict

from opentrons.broker import Broker
from opentrons.protocol_api import MAX_SUPPORTED_VERSION, ModuleContext, Labware
from opentrons.protocol_api.core.common import LabwareCore, ModuleCore, ProtocolCore
from opentrons.protocol_api.core.labware import LabwareLoadParams
from opentrons.protocol_api.core.core_map import LoadedCoreMap


@pytest.fixture
def mock_core(decoy: Decoy) -> ModuleCore:
    """Get a mock module implementation core."""
    return decoy.mock(cls=ModuleCore)


@pytest.fixture
def mock_core_map(decoy: Decoy) -> LoadedCoreMap:
    """Get a mock core map."""
    return decoy.mock(cls=LoadedCoreMap)


@pytest.fixture
def mock_protocol_core(decoy: Decoy) -> ProtocolCore:
    """Get a mock protocol implementation core."""
    return decoy.mock(cls=ProtocolCore)


@pytest.fixture
def mock_broker(decoy: Decoy) -> Broker:
    """Get a mock command message broker."""
    return decoy.mock(cls=Broker)


@pytest.fixture
def subject(
    mock_core: ModuleCore,
    mock_core_map: LoadedCoreMap,
    mock_protocol_core: ProtocolCore,
    mock_broker: Broker,
) -> ModuleContext[Any]:
    """Get a generic module context with its dependencies mocked out."""
    return ModuleContext(
        core=mock_core,
        core_map=mock_core_map,
        protocol_core=mock_protocol_core,
        broker=mock_broker,
        api_version=MAX_SUPPORTED_VERSION,
    )


def test_get_labware(
    decoy: Decoy, mock_core: ModuleCore, subject: ModuleContext[Any]
) -> None:
    """It should return the labware from the core's geometry object."""
    mock_labware = decoy.mock(cls=Labware)
    decoy.when(mock_core.geometry.labware).then_return(mock_labware)

    assert subject.labware is mock_labware


def test_load_labware(
    decoy: Decoy,
    mock_protocol_core: ProtocolCore,
    mock_core_map: LoadedCoreMap,
    mock_core: ModuleCore,
    subject: ModuleContext[Any],
) -> None:
    """It should load labware by load parameters."""
    mock_labware_core = decoy.mock(cls=LabwareCore)
    mock_labware = decoy.mock(cls=Labware)

    decoy.when(
        mock_protocol_core.load_labware(
            load_name="infinite tip rack",
            label="it doesn't run out",
            namespace="ideal",
            version=101,
            location=mock_core,
        )
    ).then_return(mock_labware_core)

    decoy.when(mock_labware_core.get_name()).then_return("Full Name")

    decoy.when(mock_core.add_labware_core(mock_labware_core)).then_return(mock_labware)

    result = subject.load_labware(
        name="infinite tip rack",
        label="it doesn't run out",
        namespace="ideal",
        version=101,
    )

    assert result is mock_labware
    decoy.verify(mock_core_map.add(mock_labware_core, result), times=1)


def test_load_labware_from_definition(
    decoy: Decoy,
    mock_core: ModuleCore,
    mock_protocol_core: ProtocolCore,
    subject: ModuleContext[Any],
) -> None:
    """It should be able to load a labware from a definition dictionary."""
    mock_labware_core = decoy.mock(cls=LabwareCore)
    mock_labware = decoy.mock(cls=Labware)

    labware_definition_dict = cast(LabwareDefDict, {"labwareDef": True})
    labware_load_params = LabwareLoadParams("you", "are", 1337)

    decoy.when(
        mock_protocol_core.add_labware_definition(labware_definition_dict)
    ).then_return(labware_load_params)

    decoy.when(mock_labware_core.get_name()).then_return("Full Name")

    decoy.when(mock_core.add_labware_core(mock_labware_core)).then_return(mock_labware)

    decoy.when(
        mock_protocol_core.load_labware(
            namespace="you",
            load_name="are",
            version=1337,
            label="Some Display Name",
            location=mock_core,
        )
    ).then_return(mock_labware_core)

    result = subject.load_labware_from_definition(
        definition=labware_definition_dict,
        label="Some Display Name",
    )

    assert result is mock_labware
