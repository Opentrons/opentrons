"""Tests for the legacy Protocol API core implementation."""
import inspect
from typing import Any, Dict, cast

import pytest
from decoy import Decoy

from opentrons_shared_data.labware.dev_types import LabwareDefinition as LabwareDefDict
from opentrons_shared_data.pipette.dev_types import PipetteNameType

from opentrons.types import DeckSlotName, Location, Mount, Point
from opentrons.equipment_broker import EquipmentBroker
from opentrons.hardware_control import SyncHardwareAPI
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.hardware_control.modules.types import TemperatureModuleModel
from opentrons.protocols import labware as mock_labware
from opentrons.protocols.geometry.deck import Deck
from opentrons.protocol_api import MAX_SUPPORTED_VERSION
from opentrons.protocol_api.core.protocol_api.load_info import (
    LoadInfo,
    LabwareLoadInfo,
    InstrumentLoadInfo,
)
from opentrons.protocol_api.core.labware import LabwareLoadParams
from opentrons.protocol_api.core.protocol_api.labware_offset_provider import (
    AbstractLabwareOffsetProvider,
    ProvidedLabwareOffset,
)
from opentrons.protocol_api.core.protocol_api.instrument_context import (
    InstrumentContextImplementation,
)
from opentrons.protocol_api.core.protocol_api.labware import LabwareImplementation
from opentrons.protocol_api.core.protocol_api.legacy_module_core import LegacyModuleCore
from opentrons.protocol_api.core.protocol_api.protocol_context import (
    ProtocolContextImplementation,
)


@pytest.fixture(autouse=True)
def _mock_labware_module(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Mock out opentrons.protocols.labware functions."""
    for name, func in inspect.getmembers(mock_labware, inspect.isfunction):
        monkeypatch.setattr(mock_labware, name, decoy.mock(func=func))


@pytest.fixture
def mock_sync_hardware_api(decoy: Decoy) -> SyncHardwareAPI:
    """Get a mock hardware API."""
    return decoy.mock(cls=SyncHardwareAPI)


@pytest.fixture
def mock_deck(decoy: Decoy) -> Deck:
    """Get a mock Deck."""

    class _MockDeck(Dict[str, Any]):
        ...

    deck = _MockDeck()
    setattr(deck, "position_for", decoy.mock(name="Deck.position_for"))
    return cast(Deck, deck)


@pytest.fixture
def mock_labware_offset_provider(decoy: Decoy) -> AbstractLabwareOffsetProvider:
    """Get a mock offset provider core."""
    return decoy.mock(cls=AbstractLabwareOffsetProvider)


@pytest.fixture
def mock_equipment_broker(decoy: Decoy) -> EquipmentBroker[LoadInfo]:
    """Get a mock equipment broker."""
    return decoy.mock(cls=EquipmentBroker)


@pytest.fixture
def subject(
    mock_sync_hardware_api: SyncHardwareAPI,
    mock_labware_offset_provider: AbstractLabwareOffsetProvider,
    mock_equipment_broker: EquipmentBroker[LoadInfo],
    mock_deck: Deck,
) -> ProtocolContextImplementation:
    """Get a legacy protocol implementation core with mocked out dependencies."""
    return ProtocolContextImplementation(
        api_version=MAX_SUPPORTED_VERSION,
        sync_hardware=mock_sync_hardware_api,
        labware_offset_provider=mock_labware_offset_provider,
        equipment_broker=mock_equipment_broker,
        deck_layout=mock_deck,
    )


def test_load_instrument(
    decoy: Decoy,
    mock_sync_hardware_api: SyncHardwareAPI,
    mock_equipment_broker: EquipmentBroker[LoadInfo],
    subject: ProtocolContextImplementation,
) -> None:
    """It should load an instrument core."""
    pipette_dict = cast(
        PipetteDict,
        {
            "default_aspirate_flow_rates": {"1.1": 22},
            "default_dispense_flow_rates": {"3.3": 44},
            "default_blow_out_flow_rates": {"5.5": 66},
        },
    )

    decoy.when(mock_sync_hardware_api.attached_instruments).then_return({})
    decoy.when(mock_sync_hardware_api.get_attached_instrument(Mount.RIGHT)).then_return(
        pipette_dict
    )

    result = subject.load_instrument(
        instrument_name=PipetteNameType.P300_SINGLE, mount=Mount.RIGHT
    )

    assert isinstance(result, InstrumentContextImplementation)

    decoy.verify(
        mock_sync_hardware_api.cache_instruments({Mount.RIGHT: "p300_single"}),
        mock_equipment_broker.publish(
            InstrumentLoadInfo(instrument_load_name="p300_single", mount=Mount.RIGHT)
        ),
    )


def test_load_labware(
    decoy: Decoy,
    mock_deck: Deck,
    mock_labware_offset_provider: AbstractLabwareOffsetProvider,
    mock_equipment_broker: EquipmentBroker[LoadInfo],
    subject: ProtocolContextImplementation,
) -> None:
    """It should load a labware core."""
    labware_definition_dict = cast(
        LabwareDefDict,
        {
            "namespace": "super cool namespace",
            "parameters": {"loadName": "super cool load name"},
            "version": 42,
            "wells": {},
            "ordering": [],
            "dimensions": {"xDimension": 0, "yDimension": 0, "zDimension": 0},
            "cornerOffsetFromSlot": {"x": 4, "y": 5, "z": 6},
        },
    )

    decoy.when(
        mock_labware.get_labware_definition(
            load_name="cool load name",
            namespace="cool namespace",
            version=1337,
            bundled_defs=None,
            extra_defs={},
        )
    ).then_return(labware_definition_dict)

    decoy.when(mock_deck.position_for("5")).then_return(
        Location(Point(1, 2, 3), "5"),
    )

    decoy.when(
        mock_labware_offset_provider.find(
            load_params=LabwareLoadParams(
                namespace="super cool namespace",
                load_name="super cool load name",
                version=42,
            ),
            requested_module_model=None,
            deck_slot=DeckSlotName.SLOT_5,
        )
    ).then_return(ProvidedLabwareOffset(delta=Point(7, 8, 9), offset_id="offset-789"))

    result = subject.load_labware(
        load_name="cool load name",
        location=DeckSlotName.SLOT_5,
        label="cool label",
        namespace="cool namespace",
        version=1337,
    )

    assert isinstance(result, LabwareImplementation)
    assert mock_deck["5"] is result
    assert result.get_definition() == labware_definition_dict
    assert result.get_user_display_name() == "cool label"
    assert result.get_geometry().parent == Location(Point(1, 2, 3), "5")
    assert result.get_calibrated_offset() == Point(
        x=(1 + 4 + 7),
        y=(2 + 5 + 8),
        z=(3 + 6 + 9),
    )

    decoy.verify(
        mock_equipment_broker.publish(
            LabwareLoadInfo(
                labware_definition=labware_definition_dict,
                labware_namespace="super cool namespace",
                labware_load_name="super cool load name",
                labware_version=42,
                deck_slot=DeckSlotName.SLOT_5,
                on_module=False,
                offset_id="offset-789",
                labware_display_name="cool label",
            )
        ),
        times=1,
    )


def test_load_labware_on_module(
    decoy: Decoy,
    mock_deck: Deck,
    mock_labware_offset_provider: AbstractLabwareOffsetProvider,
    mock_equipment_broker: EquipmentBroker[LoadInfo],
    subject: ProtocolContextImplementation,
) -> None:
    """It should load a labware core."""
    mock_module_core = decoy.mock(cls=LegacyModuleCore)

    labware_definition_dict = cast(
        LabwareDefDict,
        {
            "namespace": "super cool namespace",
            "parameters": {"loadName": "super cool load name"},
            "version": 42,
            "wells": {},
            "ordering": [],
            "dimensions": {"xDimension": 0, "yDimension": 0, "zDimension": 0},
            "cornerOffsetFromSlot": {"x": 4, "y": 5, "z": 6},
        },
    )

    decoy.when(
        mock_labware.get_labware_definition(
            load_name="cool load name",
            namespace="cool namespace",
            version=1337,
            bundled_defs=None,
            extra_defs={},
        )
    ).then_return(labware_definition_dict)

    decoy.when(mock_module_core.get_requested_model()).then_return(
        TemperatureModuleModel.TEMPERATURE_V1
    )
    decoy.when(mock_module_core.get_deck_slot()).then_return(DeckSlotName.SLOT_5)
    decoy.when(mock_module_core.geometry.location).then_return(
        Location(Point(1, 2, 3), mock_module_core.geometry)
    )

    decoy.when(
        mock_labware_offset_provider.find(
            load_params=LabwareLoadParams(
                namespace="super cool namespace",
                load_name="super cool load name",
                version=42,
            ),
            requested_module_model=TemperatureModuleModel.TEMPERATURE_V1,
            deck_slot=DeckSlotName.SLOT_5,
        )
    ).then_return(ProvidedLabwareOffset(delta=Point(7, 8, 9), offset_id="offset-789"))

    result = subject.load_labware(
        load_name="cool load name",
        location=mock_module_core,
        label="cool label",
        namespace="cool namespace",
        version=1337,
    )

    assert isinstance(result, LabwareImplementation)
    assert result.get_calibrated_offset() == Point(
        x=(1 + 4 + 7),
        y=(2 + 5 + 8),
        z=(3 + 6 + 9),
    )

    decoy.verify(
        mock_equipment_broker.publish(
            LabwareLoadInfo(
                labware_definition=labware_definition_dict,
                labware_namespace="super cool namespace",
                labware_load_name="super cool load name",
                labware_version=42,
                deck_slot=DeckSlotName.SLOT_5,
                on_module=True,
                offset_id="offset-789",
                labware_display_name="cool label",
            )
        ),
        times=1,
    )
