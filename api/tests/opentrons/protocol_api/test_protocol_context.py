"""Tests for the ProtocolContext public interface."""
import inspect
from typing import cast

import pytest
from decoy import Decoy, matchers

from opentrons_shared_data.pipette.dev_types import PipetteNameType
from opentrons_shared_data.labware.dev_types import LabwareDefinition as LabwareDefDict

from opentrons.types import Mount, DeckSlotName
from opentrons.hardware_control.modules.types import ModuleType, TemperatureModuleModel
from opentrons.protocol_api import (
    MAX_SUPPORTED_VERSION,
    ProtocolContext,
    InstrumentContext,
    ModuleContext,
    Labware,
    validation,
)
from opentrons.protocol_api.core.labware import LabwareLoadParams

from .types import InstrumentCore, LabwareCore, ModuleCore, ProtocolCore


@pytest.fixture(autouse=True)
def _mock_validation_module(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    for name, func in inspect.getmembers(validation, inspect.isfunction):
        monkeypatch.setattr(validation, name, decoy.mock(func=func))


@pytest.fixture
def mock_core(decoy: Decoy) -> ProtocolCore:
    """Get a mock implementation core."""
    return decoy.mock(cls=ProtocolCore)


@pytest.fixture
def subject(mock_core: ProtocolCore) -> ProtocolContext:
    """Get a ProtocolContext test subject with its dependencies mocked out."""
    return ProtocolContext(
        api_version=MAX_SUPPORTED_VERSION,
        implementation=mock_core,
    )


def test_load_instrument(
    decoy: Decoy,
    mock_core: ProtocolCore,
    subject: ProtocolContext,
) -> None:
    """It should create a instrument using its execution core."""
    mock_instrument_core = decoy.mock(cls=InstrumentCore)

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
    decoy: Decoy, mock_core: ProtocolCore, subject: ProtocolContext
) -> None:
    """It should allow/disallow pipette replacement."""
    mock_instrument_core = decoy.mock(cls=InstrumentCore)

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
    mock_core: ProtocolCore,
    subject: ProtocolContext,
) -> None:
    """It should create a labware using its execution core."""
    mock_labware_core = decoy.mock(cls=LabwareCore)

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

    decoy.when(mock_labware_core.get_name()).then_return("Full Name")

    result = subject.load_labware(
        load_name="some_labware",
        location=42,
        label="some_display_name",
        namespace="some_namespace",
        version=1337,
    )

    assert isinstance(result, Labware)
    assert result.name == "Full Name"


def test_load_labware_from_definition(
    decoy: Decoy,
    mock_core: ProtocolCore,
    subject: ProtocolContext,
) -> None:
    """It should be able to load a labware from a definition dictionary."""
    mock_labware_core = decoy.mock(cls=LabwareCore)

    labware_definition_dict = cast(LabwareDefDict, {"labwareDef": True})
    labware_load_params = LabwareLoadParams("you", "are", 1337)

    decoy.when(validation.ensure_deck_slot(42)).then_return(DeckSlotName.SLOT_1)
    decoy.when(mock_core.add_labware_definition(labware_definition_dict)).then_return(
        labware_load_params
    )

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

    result = subject.load_labware_from_definition(
        labware_def=labware_definition_dict,
        location=42,
        label="Some Display Name",
    )

    assert isinstance(result, Labware)
    assert result.name == "Full Name"


def test_load_module(
    decoy: Decoy,
    mock_core: ProtocolCore,
    subject: ProtocolContext,
) -> None:
    """It should load a module."""
    mock_module_core = decoy.mock(cls=ModuleCore)

    decoy.when(validation.ensure_module_model("spline reticulator")).then_return(
        TemperatureModuleModel.TEMPERATURE_V1
    )
    decoy.when(validation.ensure_deck_slot(42)).then_return(DeckSlotName.SLOT_3)

    decoy.when(
        mock_core.load_module(
            model=TemperatureModuleModel.TEMPERATURE_V1,
            deck_slot=DeckSlotName.SLOT_3,
            configuration=None,
        )
    ).then_return(mock_module_core)

    decoy.when(mock_module_core.get_type()).then_return(ModuleType.TEMPERATURE)
    decoy.when(mock_module_core.get_model()).then_return(
        TemperatureModuleModel.TEMPERATURE_V2
    )
    decoy.when(mock_module_core.get_serial_number()).then_return("cap'n crunch")
    decoy.when(mock_module_core.get_deck_slot()).then_return(DeckSlotName.SLOT_3)

    result = subject.load_module(module_name="spline reticulator", location=42)

    assert isinstance(result, ModuleContext)
    assert subject.loaded_modules[3] is result


def test_load_module_default_location(
    decoy: Decoy,
    mock_core: ProtocolCore,
    subject: ProtocolContext,
) -> None:
    """It should load a module without specifying a location explicitely."""
    mock_module_core = decoy.mock(cls=ModuleCore)

    decoy.when(validation.ensure_module_model("spline reticulator")).then_return(
        TemperatureModuleModel.TEMPERATURE_V1
    )

    decoy.when(
        mock_core.load_module(
            model=TemperatureModuleModel.TEMPERATURE_V1,
            deck_slot=None,
            configuration=None,
        )
    ).then_return(mock_module_core)

    decoy.when(mock_module_core.get_type()).then_return(ModuleType.TEMPERATURE)
    decoy.when(mock_module_core.get_model()).then_return(
        TemperatureModuleModel.TEMPERATURE_V2
    )
    decoy.when(mock_module_core.get_serial_number()).then_return("cap'n crunch")
    decoy.when(mock_module_core.get_deck_slot()).then_return(DeckSlotName.SLOT_3)

    result = subject.load_module(module_name="spline reticulator", location=42)

    assert isinstance(result, ModuleContext)
    assert subject.loaded_modules[3] is result
