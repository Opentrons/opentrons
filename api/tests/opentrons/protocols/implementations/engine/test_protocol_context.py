import pytest
from decoy import Decoy
from mock import AsyncMock

from opentrons_shared_data.labware.dev_types import LabwareDefinition
from opentrons.types import DeckSlotName
from opentrons.protocol_engine import StateView, DeckSlotLocation

from opentrons.protocol_engine.commands import (
    LoadLabwareResult
)
from opentrons.protocols.implementations.engine import (
    ProtocolEngineContext,
    LabwareContext,
    SyncProtocolEngine,
)

from opentrons.types import Mount


@pytest.fixture
def decoy() -> Decoy:
    """Create a Decoy state container for this test suite."""
    return Decoy()


@pytest.fixture
def sync_engine(decoy: Decoy) -> SyncProtocolEngine:
    """Get a test double SyncProtocolEngine."""
    return decoy.create_decoy(spec=SyncProtocolEngine)


@pytest.fixture
def engine_state(decoy: Decoy) -> StateView:
    """Get a test double ProtocolEngine StateView."""
    return decoy.create_decoy(spec=StateView)


@pytest.fixture
def subject(
    decoy: Decoy,
    sync_engine: SyncProtocolEngine,
    engine_state: StateView,
) -> ProtocolEngineContext:
    """Get a ProtocolEngineContext with fake dependencies."""
    return ProtocolEngineContext(
        sync_engine=sync_engine,
        state_view=engine_state,
    )


def test_get_bundled_data(
        subject: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        subject.get_bundled_data()


def test_get_bundled_labware(
        subject: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        subject.get_bundled_labware()


def test_get_extra_labware(
        subject: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        subject.get_extra_labware()


def test_cleanup(subject: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        subject.cleanup()


def test_get_max_speeds(subject: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        subject.get_max_speeds()


def test_get_hardware(subject: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        subject.get_hardware()


def test_connect(subject: ProtocolEngineContext) -> None:
    mock_hardware = AsyncMock()
    with pytest.raises(NotImplementedError):
        subject.connect(hardware=mock_hardware)


def test_disconnect(subject: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        subject.disconnect()


def test_is_simulating(subject: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        subject.is_simulating()


def test_load_labware_from_definition(
        subject: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        subject.load_labware_from_definition({}, "")


@pytest.mark.xfail(reason="Not yet implemented", raises=NotImplementedError)
def test_load_labware(
    decoy: Decoy,
    minimal_labware_def: LabwareDefinition,
    sync_engine: SyncProtocolEngine,
    engine_state: StateView,
    subject: ProtocolEngineContext,
) -> None:
    """It should use the engine to load a labware in a slot."""
    decoy.when(
        sync_engine.load_labware(
            location=DeckSlotLocation(slot=DeckSlotName.SLOT_5),
            load_name="some_labware",
            namespace="opentrons",
            version=1,
        )
    ).then_return(
        LoadLabwareResult(
            labwareId="abc123",
            definition=minimal_labware_def,
            calibration=(1, 2, 3),
        )
    )

    result = subject.load_labware(
        load_name="some_labware",
        location=5,
        namespace="opentrons",
        version=1,
    )

    assert result == LabwareContext(labware_id="abc123", state_view=engine_state)


def test_load_module(subject: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        subject.load_module(module_name="name", location=None,
                            configuration="")


def test_get_loaded_modules(
        subject: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        subject.get_loaded_modules()


def test_load_instrument(
        subject: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        subject.load_instrument(
            instrument_name="", mount=Mount.RIGHT
        )


def test_get_loaded_instruments(
        subject: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        subject.get_loaded_instruments()


def test_pause(subject: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        subject.pause()


def test_resume(subject: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        subject.resume()


def test_comment(subject: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        subject.comment(msg="")


def test_delay(subject: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        subject.delay(1)


def test_home(subject: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        subject.home()


def test_get_deck(subject: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        subject.get_deck()


def test_get_fixed_trash(
        subject: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        subject.get_fixed_trash()


def test_set_rail_lights(
        subject: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        subject.set_rail_lights(True)


def test_get_rail_lights_on(
        subject: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        subject.get_rail_lights_on()


def test_door_closed(subject: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        subject.door_closed()


def test_get_last_location(
        subject: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        subject.get_last_location()


def test_set_last_location(
        subject: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        subject.set_last_location(None)
