"""Tests for Protocol API Flex Stacker contexts."""

import pytest
from decoy import Decoy, matchers

from opentrons.types import DeckSlotName
from opentrons.legacy_broker import LegacyBroker
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_api import FlexStackerContext, Labware
from opentrons.protocol_api.core.common import (
    ProtocolCore,
    LabwareCore,
    FlexStackerCore,
)
from opentrons.protocol_api.core.core_map import LoadedCoreMap

from . import versions_at_or_above


@pytest.fixture
def mock_core(decoy: Decoy) -> FlexStackerCore:
    """Get a mock module implementation core."""
    core = decoy.mock(cls=FlexStackerCore)
    decoy.when(core.get_display_name()).then_return("mock stacker core")
    decoy.when(core.get_deck_slot()).then_return(DeckSlotName.SLOT_D3)
    return core


@pytest.fixture
def mock_protocol_core(decoy: Decoy) -> ProtocolCore:
    """Get a mock protocol implementation core."""
    return decoy.mock(cls=ProtocolCore)


@pytest.fixture
def mock_labware_core(decoy: Decoy) -> LabwareCore:
    """Get a mock labware implementation core."""
    mock_core = decoy.mock(cls=LabwareCore)
    decoy.when(mock_core.get_well_columns()).then_return([])
    return mock_core


@pytest.fixture
def mock_core_map(decoy: Decoy) -> LoadedCoreMap:
    """Get a mock LoadedCoreMap."""
    return decoy.mock(cls=LoadedCoreMap)


@pytest.fixture
def mock_broker(decoy: Decoy) -> LegacyBroker:
    """Get a mock command message broker."""
    return decoy.mock(cls=LegacyBroker)


@pytest.fixture
def subject(
    api_version: APIVersion,
    mock_core: FlexStackerCore,
    mock_protocol_core: ProtocolCore,
    mock_core_map: LoadedCoreMap,
    mock_broker: LegacyBroker,
) -> FlexStackerContext:
    """Get an absorbance reader context with its dependencies mocked out."""
    return FlexStackerContext(
        core=mock_core,
        protocol_core=mock_protocol_core,
        core_map=mock_core_map,
        broker=mock_broker,
        api_version=api_version,
    )


@pytest.mark.parametrize(
    "api_version", versions_at_or_above(from_version=APIVersion(2, 25))
)
def test_get_serial_number(
    decoy: Decoy, mock_core: FlexStackerCore, subject: FlexStackerContext
) -> None:
    """It should get the serial number from the core."""
    decoy.when(mock_core.get_serial_number()).then_return("12345")
    result = subject.serial_number
    assert result == "12345"


@pytest.mark.parametrize(
    "api_version", versions_at_or_above(from_version=APIVersion(2, 25))
)
def test_fill(
    decoy: Decoy, mock_core: FlexStackerCore, subject: FlexStackerContext
) -> None:
    """It should pass args to the core."""
    subject.fill(2, "hello")
    decoy.verify(mock_core.fill(2, "hello"))


@pytest.mark.parametrize(
    "api_version", versions_at_or_above(from_version=APIVersion(2, 25))
)
def test_empty(
    decoy: Decoy, mock_core: FlexStackerCore, subject: FlexStackerContext
) -> None:
    """It should pass args to the core."""
    subject.empty("goodbye")
    decoy.verify(mock_core.empty("goodbye"))


@pytest.mark.parametrize(
    "api_version", versions_at_or_above(from_version=APIVersion(2, 25))
)
def test_set_stored_labware(
    decoy: Decoy, mock_core: FlexStackerCore, subject: FlexStackerContext
) -> None:
    """It should route arguments appropriately."""
    subject.set_stored_labware(
        "load_name", "namespace", 1, "adapter", "lid", 2, stacking_offset_z=1.0
    )
    decoy.verify(
        mock_core.set_stored_labware(
            main_load_name="load_name",
            main_namespace="namespace",
            main_version=1,
            lid_load_name="lid",
            lid_namespace="namespace",
            lid_version=1,
            adapter_load_name="adapter",
            adapter_namespace="namespace",
            adapter_version=1,
            count=2,
            stacking_offset_z=1.0,
        )
    )


@pytest.mark.parametrize(
    "api_version", versions_at_or_above(from_version=APIVersion(2, 25))
)
def test_get_max_storable_labware_from_list(
    decoy: Decoy,
    mock_core: FlexStackerCore,
    mock_protocol_core: ProtocolCore,
    mock_core_map: LoadedCoreMap,
    subject: FlexStackerContext,
) -> None:
    """It should filter its arguments and responses."""
    base_cores = [decoy.mock(cls=LabwareCore) for _ in range(5)]
    for idx, core in enumerate(base_cores):
        decoy.when(core.get_well_columns()).then_return([])
        decoy.when(core.get_display_name()).then_return(f"core-{idx}")
        decoy.when(mock_core_map.get_or_add(core, matchers.Anything())).then_do(
            lambda lw, builder: builder(lw)
        )
    base_lw = [
        Labware(
            core=core,
            api_version=APIVersion(2, 25),
            protocol_core=mock_protocol_core,
            core_map=subject._core_map,
        )
        for core in base_cores
    ]
    decoy.when(
        mock_core.get_max_storable_labware_from_list(base_cores, 1.0)
    ).then_return(base_cores[:3])
    assert subject.get_max_storable_labware_from_list(base_lw, 1.0) == base_lw[:3]


@pytest.mark.parametrize(
    "api_version", versions_at_or_above(from_version=APIVersion(2, 25))
)
def test_get_current_storable_labware_from_list(
    decoy: Decoy,
    mock_core: FlexStackerCore,
    mock_protocol_core: ProtocolCore,
    mock_core_map: LoadedCoreMap,
    subject: FlexStackerContext,
) -> None:
    """It should filter its arguments and responses."""
    base_cores = [decoy.mock(cls=LabwareCore) for _ in range(5)]
    for idx, core in enumerate(base_cores):
        decoy.when(core.get_well_columns()).then_return([])
        decoy.when(core.get_display_name()).then_return(f"core-{idx}")
        decoy.when(mock_core_map.get_or_add(core, matchers.Anything())).then_do(
            lambda lw, builder: builder(lw)
        )
    base_lw = [
        Labware(
            core=core,
            api_version=APIVersion(2, 25),
            protocol_core=mock_protocol_core,
            core_map=subject._core_map,
        )
        for core in base_cores
    ]
    decoy.when(
        mock_core.get_current_storable_labware_from_list(base_cores)
    ).then_return(base_cores[:3])
    assert subject.get_current_storable_labware_from_list(base_lw) == base_lw[:3]


@pytest.mark.parametrize(
    "api_version", versions_at_or_above(from_version=APIVersion(2, 25))
)
def test_get_max_storable_labware(
    decoy: Decoy,
    mock_core: FlexStackerCore,
    subject: FlexStackerContext,
) -> None:
    """It should filter its arguments and responses."""
    decoy.when(mock_core.get_max_storable_labware()).then_return(3)
    assert subject.get_max_storable_labware() == 3


@pytest.mark.parametrize(
    "api_version", versions_at_or_above(from_version=APIVersion(2, 25))
)
def test_get_current_storable_labware(
    decoy: Decoy,
    mock_core: FlexStackerCore,
    subject: FlexStackerContext,
) -> None:
    """It should filter its arguments and responses."""
    decoy.when(mock_core.get_current_storable_labware()).then_return(3)
    assert subject.get_current_storable_labware() == 3


@pytest.mark.parametrize(
    "api_version", versions_at_or_above(from_version=APIVersion(2, 25))
)
def test_get_stored_labware(
    decoy: Decoy,
    mock_core: FlexStackerCore,
    mock_protocol_core: ProtocolCore,
    mock_core_map: LoadedCoreMap,
    subject: FlexStackerContext,
) -> None:
    """It should wrap the response in Labwares."""
    base_cores = [decoy.mock(cls=LabwareCore) for _ in range(5)]
    for idx, core in enumerate(base_cores):
        decoy.when(core.get_well_columns()).then_return([])
        decoy.when(core.get_display_name()).then_return(f"core-{idx}")
        decoy.when(mock_core_map.get_or_add(core, matchers.Anything())).then_do(
            lambda lw, builder: builder(lw)
        )
    base_lw = [
        Labware(
            core=core,
            api_version=APIVersion(2, 25),
            protocol_core=mock_protocol_core,
            core_map=subject._core_map,
        )
        for core in base_cores
    ]
    decoy.when(mock_core.get_stored_labware()).then_return(base_cores)
    assert subject.get_stored_labware() == base_lw


@pytest.mark.parametrize(
    "api_version", versions_at_or_above(from_version=APIVersion(2, 25))
)
@pytest.mark.parametrize("message", ["hello", None])
def test_fill_items(
    decoy: Decoy,
    mock_core: FlexStackerCore,
    mock_protocol_core: ProtocolCore,
    mock_core_map: LoadedCoreMap,
    subject: FlexStackerContext,
    message: str | None,
) -> None:
    """It should wrap the response in Labwares."""
    base_cores = [decoy.mock(cls=LabwareCore) for _ in range(5)]
    for idx, core in enumerate(base_cores):
        decoy.when(core.get_well_columns()).then_return([])
        decoy.when(core.get_display_name()).then_return(f"core-{idx}")

    base_lw = [
        Labware(
            core=core,
            api_version=APIVersion(2, 25),
            protocol_core=mock_protocol_core,
            core_map=subject._core_map,
        )
        for core in base_cores
    ]
    subject.fill_items(base_lw, message)
    decoy.verify(mock_core.fill_items(base_cores, message))


@pytest.mark.parametrize(
    "api_version", versions_at_or_above(from_version=APIVersion(2, 25))
)
def test_set_stored_labware_items(
    decoy: Decoy,
    mock_core: FlexStackerCore,
    mock_protocol_core: ProtocolCore,
    mock_core_map: LoadedCoreMap,
    subject: FlexStackerContext,
) -> None:
    """It should wrap the response in Labwares."""
    base_cores = [decoy.mock(cls=LabwareCore) for _ in range(5)]
    for idx, core in enumerate(base_cores):
        decoy.when(core.get_well_columns()).then_return([])
        decoy.when(core.get_display_name()).then_return(f"core-{idx}")

    base_lw = [
        Labware(
            core=core,
            api_version=APIVersion(2, 25),
            protocol_core=mock_protocol_core,
            core_map=subject._core_map,
        )
        for core in base_cores
    ]
    subject.set_stored_labware_items(base_lw, stacking_offset_z=1.0)
    decoy.verify(mock_core.set_stored_labware_items(base_cores, 1.0))
