import pytest
from mock import AsyncMock

from opentrons.protocol_engine import ProtocolEngine
from opentrons.protocols.context.engine.protocol_context import \
    ProtocolEngineContext
from opentrons.types import Mount


@pytest.fixture
def mock_protocol_engine() -> AsyncMock:
    """Mock of ProtocolEngine"""
    return AsyncMock(spec=ProtocolEngine)


@pytest.fixture
def protocol_engine_context(mock_protocol_engine) -> ProtocolEngineContext:
    """Subject fixture."""
    return ProtocolEngineContext(protocol_engine=mock_protocol_engine)


def test_get_bundled_data(
        protocol_engine_context: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        protocol_engine_context.get_bundled_data()


def test_get_bundled_labware(
        protocol_engine_context: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        protocol_engine_context.get_bundled_labware()


def test_get_extra_labware(
        protocol_engine_context: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        protocol_engine_context.get_extra_labware()


def test_cleanup(protocol_engine_context: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        protocol_engine_context.cleanup()


def test_get_max_speeds(protocol_engine_context: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        protocol_engine_context.get_max_speeds()


def test_get_hardware(protocol_engine_context: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        protocol_engine_context.get_hardware()


def test_connect(protocol_engine_context: ProtocolEngineContext) -> None:
    mock_hardware = AsyncMock()
    with pytest.raises(NotImplementedError):
        protocol_engine_context.connect(hardware=mock_hardware)


def test_disconnect(protocol_engine_context: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        protocol_engine_context.disconnect()


def test_is_simulating(protocol_engine_context: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        protocol_engine_context.is_simulating()


def test_load_labware_from_definition(
        protocol_engine_context: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        protocol_engine_context.load_labware_from_definition({}, "")


def test_load_labware(protocol_engine_context: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        protocol_engine_context.load_labware(load_name="name", location="")


def test_load_module(protocol_engine_context: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        protocol_engine_context.load_module(module_name="name", location=None,
                                            configuration="")


def test_get_loaded_modules(
        protocol_engine_context: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        protocol_engine_context.get_loaded_modules()


def test_load_instrument(
        protocol_engine_context: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        protocol_engine_context.load_instrument(
            instrument_name="", mount=Mount.RIGHT
        )


def test_get_loaded_instruments(
        protocol_engine_context: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        protocol_engine_context.get_loaded_instruments()


def test_pause(protocol_engine_context: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        protocol_engine_context.pause()


def test_resume(protocol_engine_context: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        protocol_engine_context.resume()


def test_comment(protocol_engine_context: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        protocol_engine_context.comment(msg="")


def test_delay(protocol_engine_context: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        protocol_engine_context.delay(1)


def test_home(protocol_engine_context: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        protocol_engine_context.home()


def test_get_deck(protocol_engine_context: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        protocol_engine_context.get_deck()


def test_get_fixed_trash(
        protocol_engine_context: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        protocol_engine_context.get_fixed_trash()


def test_set_rail_lights(
        protocol_engine_context: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        protocol_engine_context.set_rail_lights(True)


def test_get_rail_lights_on(
        protocol_engine_context: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        protocol_engine_context.get_rail_lights_on()


def test_door_closed(protocol_engine_context: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        protocol_engine_context.door_closed()


def test_get_last_location(
        protocol_engine_context: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        protocol_engine_context.get_last_location()


def test_set_last_location(
        protocol_engine_context: ProtocolEngineContext) -> None:
    with pytest.raises(NotImplementedError):
        protocol_engine_context.set_last_location(None)
