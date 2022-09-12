"""Tests for the ProtocolContext public interface."""
import inspect
from typing import cast

import pytest
from decoy import Decoy, matchers

from opentrons_shared_data.pipette.dev_types import PipetteNameType
from opentrons_shared_data.labware.dev_types import LabwareDefinition as LabwareDefDict

from opentrons.types import Mount, Point, DeckSlotName
from opentrons.equipment_broker import EquipmentBroker
from opentrons.protocol_api import (
    MAX_SUPPORTED_VERSION,
    ProtocolContext,
    InstrumentContext,
    Labware,
    validation,
)

from opentrons.protocol_api.load_info import LoadInfo, LabwareLoadInfo

from opentrons.protocol_api.core.protocol import (
    AbstractProtocol as BaseAbstractProtocol,
)
from opentrons.protocol_api.core.instrument import (
    AbstractInstrument as BaseAbstractInstrument,
)
from opentrons.protocol_api.core.labware import (
    AbstractLabware as BaseAbstractLabware,
    LabwareLoadParams,
)
from opentrons.protocol_api.core.well import AbstractWellCore
from opentrons.protocol_api.core.labware_offset_provider import (
    AbstractLabwareOffsetProvider,
    ProvidedLabwareOffset,
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
def mock_equipment_broker(decoy: Decoy) -> EquipmentBroker[LoadInfo]:
    """Get a mock equipment broker."""
    return decoy.mock(cls=EquipmentBroker)


@pytest.fixture
def subject(
    mock_core: AbstractProtocol,
    mock_labware_offset_provider: AbstractLabwareOffsetProvider,
    mock_equipment_broker: EquipmentBroker[LoadInfo],
) -> ProtocolContext:
    """Get a ProtocolContext test subject with its dependencies mocked out."""
    return ProtocolContext(
        api_version=MAX_SUPPORTED_VERSION,
        implementation=mock_core,
        labware_offset_provider=mock_labware_offset_provider,
        equipment_broker=mock_equipment_broker,
    )


def test_load_instrument(
    decoy: Decoy,
    mock_core: AbstractProtocol,
    subject: ProtocolContext,
) -> None:
    """It should create a instrument using its execution core."""
    mock_instrument_core = decoy.mock(cls=AbstractInstrument)

    decoy.when(validation.ensure_mount("shadowfax")).then_return(Mount.LEFT)

    decoy.when(validation.ensure_pipette_name("gandalf")).then_return(
        PipetteNameType.P300_SINGLE
    )

    decoy.when(
        mock_core.load_instrument(
            instrument_name=PipetteNameType.P300_SINGLE,
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
    decoy.when(validation.ensure_pipette_name(matchers.IsA(str))).then_return(
        PipetteNameType.P300_SINGLE
    )
    decoy.when(
        mock_core.load_instrument(
            instrument_name=matchers.IsA(PipetteNameType),
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


def test_load_labware(
    decoy: Decoy,
    mock_labware_offset_provider: AbstractLabwareOffsetProvider,
    mock_equipment_broker: EquipmentBroker[LoadInfo],
    mock_core: AbstractProtocol,
    subject: ProtocolContext,
) -> None:
    """It should create a labware using its execution core."""
    mock_labware_core = decoy.mock(cls=AbstractLabware)
    labware_load_params = LabwareLoadParams("you", "are", 1337)
    labware_definition_dict = cast(LabwareDefDict, {"labwareDef": True})
    labware_offset = ProvidedLabwareOffset(delta=Point(1, 2, 3), offset_id="offset-123")

    decoy.when(validation.ensure_deck_slot(42)).then_return(DeckSlotName.SLOT_5)

    decoy.when(
        mock_core.load_labware(
            load_name="some_labware",
            location=DeckSlotName.SLOT_5,
            label="some_display_name",
            namespace="some_namespace",
            version=1337,
        )
    ).then_return(mock_labware_core)

    decoy.when(mock_labware_core.get_user_display_name()).then_return(
        "Some Display Name"
    )
    decoy.when(mock_labware_core.get_name()).then_return("Full Name")
    decoy.when(mock_labware_core.get_load_params()).then_return(labware_load_params)
    decoy.when(mock_labware_core.get_definition()).then_return(labware_definition_dict)

    decoy.when(
        mock_labware_offset_provider.find(
            load_params=labware_load_params,
            requested_module_model=None,
            deck_slot=DeckSlotName.SLOT_5,
        )
    ).then_return(labware_offset)

    result = subject.load_labware(
        load_name="some_labware",
        location=42,
        label="some_display_name",
        namespace="some_namespace",
        version=1337,
    )

    assert isinstance(result, Labware)
    assert result.name == "Full Name"

    decoy.verify(
        # TODO(mc, 2022-09-02): labware offset provider to legacy core
        mock_labware_core.set_calibration(labware_offset.delta),
        # TODO(mc, 2022-09-02): move equipment broker to legacy core
        mock_equipment_broker.publish(
            LabwareLoadInfo(
                labware_definition=labware_definition_dict,
                labware_namespace=labware_load_params.namespace,
                labware_load_name=labware_load_params.load_name,
                labware_version=labware_load_params.version,
                deck_slot=DeckSlotName.SLOT_5,
                on_module=False,
                offset_id="offset-123",
                labware_display_name="Some Display Name",
            )
        ),
    )


def test_load_labware_from_definition(
    decoy: Decoy,
    mock_labware_offset_provider: AbstractLabwareOffsetProvider,
    mock_equipment_broker: EquipmentBroker[LoadInfo],
    mock_core: AbstractProtocol,
    subject: ProtocolContext,
) -> None:
    """It should be able to load a labware from a definition dictionary."""
    mock_labware_core = decoy.mock(cls=AbstractLabware)

    labware_definition_dict = cast(LabwareDefDict, {"labwareDef": True})
    labware_load_params = LabwareLoadParams("you", "are", 1337)
    labware_offset = ProvidedLabwareOffset(delta=Point(1, 2, 3), offset_id="offset-123")

    decoy.when(validation.ensure_deck_slot(42)).then_return(DeckSlotName.SLOT_1)
    decoy.when(mock_core.add_labware_definition(labware_definition_dict)).then_return(
        labware_load_params
    )
    decoy.when(mock_labware_core.get_load_params()).then_return(labware_load_params)
    decoy.when(mock_labware_core.get_name()).then_return("Full Name")

    decoy.when(
        mock_core.load_labware(
            namespace="you",
            load_name="are",
            version=1337,
            location=DeckSlotName.SLOT_1,
            label="Some Display Name",
        )
    ).then_return(mock_labware_core)

    decoy.when(
        mock_labware_offset_provider.find(
            load_params=labware_load_params,
            requested_module_model=None,
            deck_slot=DeckSlotName.SLOT_1,
        )
    ).then_return(labware_offset)

    result = subject.load_labware_from_definition(
        labware_def=labware_definition_dict,
        location=42,
        label="Some Display Name",
    )

    assert isinstance(result, Labware)
    assert result.name == "Full Name"
