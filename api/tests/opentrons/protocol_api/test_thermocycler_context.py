"""Tests for Protocol API thermocycler module contexts."""
import inspect
import pytest
from decoy import Decoy, matchers

from opentrons.legacy_broker import LegacyBroker
from opentrons.drivers.types import ThermocyclerLidStatus
from opentrons.hardware_control.modules import TemperatureStatus
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_api import (
    MAX_SUPPORTED_VERSION,
    ThermocyclerContext,
    validation as mock_validation,
)
from opentrons.protocol_api.core.common import ProtocolCore, ThermocyclerCore
from opentrons.protocol_api.core.core_map import LoadedCoreMap


@pytest.fixture(autouse=True)
def _mock_validation_module(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    for name, func in inspect.getmembers(mock_validation, inspect.isfunction):
        monkeypatch.setattr(mock_validation, name, decoy.mock(func=func))


@pytest.fixture
def mock_core(decoy: Decoy) -> ThermocyclerCore:
    """Get a mock module implementation core."""
    return decoy.mock(cls=ThermocyclerCore)


@pytest.fixture
def mock_protocol_core(decoy: Decoy) -> ProtocolCore:
    """Get a mock protocol implementation core."""
    return decoy.mock(cls=ProtocolCore)


@pytest.fixture
def mock_core_map(decoy: Decoy) -> LoadedCoreMap:
    """Get a mock LoadedCoreMap."""
    return decoy.mock(cls=LoadedCoreMap)


@pytest.fixture
def mock_broker(decoy: Decoy) -> LegacyBroker:
    """Get a mock command message broker."""
    return decoy.mock(cls=LegacyBroker)


@pytest.fixture
def api_version() -> APIVersion:
    """Get an API version to apply to the interface."""
    return MAX_SUPPORTED_VERSION


@pytest.fixture
def subject(
    api_version: APIVersion,
    mock_core: ThermocyclerCore,
    mock_protocol_core: ProtocolCore,
    mock_core_map: LoadedCoreMap,
    mock_broker: LegacyBroker,
) -> ThermocyclerContext:
    """Get a thermocycler module context with its dependencies mocked out."""
    return ThermocyclerContext(
        core=mock_core,
        protocol_core=mock_protocol_core,
        core_map=mock_core_map,
        broker=mock_broker,
        api_version=api_version,
    )


def test_get_lid_position(
    decoy: Decoy, mock_core: ThermocyclerCore, subject: ThermocyclerContext
) -> None:
    """It should get the lid position status from the core."""
    decoy.when(mock_core.get_lid_position()).then_return(ThermocyclerLidStatus.OPEN)
    result = subject.lid_position

    assert result == "open"
    assert isinstance(result, ThermocyclerLidStatus) is False


def test_get_block_temperature_status(
    decoy: Decoy, mock_core: ThermocyclerCore, subject: ThermocyclerContext
) -> None:
    """It should get the block temperature status from the core."""
    decoy.when(mock_core.get_block_temperature_status()).then_return(
        TemperatureStatus.IDLE
    )
    result = subject.block_temperature_status

    assert result == "idle"
    assert isinstance(result, TemperatureStatus) is False


def test_get_lid_temperature_status(
    decoy: Decoy, mock_core: ThermocyclerCore, subject: ThermocyclerContext
) -> None:
    """It should get the lid temperature status from the core."""
    decoy.when(mock_core.get_lid_temperature_status()).then_return(
        TemperatureStatus.IDLE
    )
    result = subject.lid_temperature_status

    assert result == "idle"
    assert isinstance(result, TemperatureStatus) is False


def test_get_block_temperature(
    decoy: Decoy, mock_core: ThermocyclerCore, subject: ThermocyclerContext
) -> None:
    """It should get the current block temperature from the core."""
    decoy.when(mock_core.get_block_temperature()).then_return(12.3)
    result = subject.block_temperature
    assert result == 12.3


def test_get_block_target_temperature(
    decoy: Decoy, mock_core: ThermocyclerCore, subject: ThermocyclerContext
) -> None:
    """It should get the target block temperature from the core."""
    decoy.when(mock_core.get_block_target_temperature()).then_return(12.3)
    result = subject.block_target_temperature
    assert result == 12.3


def test_get_lid_temperature(
    decoy: Decoy, mock_core: ThermocyclerCore, subject: ThermocyclerContext
) -> None:
    """It should get the current lid temperature from the core."""
    decoy.when(mock_core.get_lid_temperature()).then_return(42.0)
    result = subject.lid_temperature
    assert result == 42.0


def test_get_lid_target_temperature(
    decoy: Decoy, mock_core: ThermocyclerCore, subject: ThermocyclerContext
) -> None:
    """It should get the target lid temperature from the core."""
    decoy.when(mock_core.get_lid_target_temperature()).then_return(42.0)
    result = subject.lid_target_temperature
    assert result == 42.0


def test_get_ramp_rate(
    decoy: Decoy, mock_core: ThermocyclerCore, subject: ThermocyclerContext
) -> None:
    """It should get the current ramp rate from the core."""
    decoy.when(mock_core.get_ramp_rate()).then_return(1.23)
    result = subject.ramp_rate
    assert result == 1.23


def test_get_hold_time(
    decoy: Decoy, mock_core: ThermocyclerCore, subject: ThermocyclerContext
) -> None:
    """It should get the current hold time from the core."""
    decoy.when(mock_core.get_hold_time()).then_return(13.37)
    result = subject.hold_time
    assert result == 13.37


def test_get_total_cycle_count(
    decoy: Decoy, mock_core: ThermocyclerCore, subject: ThermocyclerContext
) -> None:
    """It should get the total cycle count from the core."""
    decoy.when(mock_core.get_total_cycle_count()).then_return(321)
    result = subject.total_cycle_count
    assert result == 321


def test_get_current_cycle_index(
    decoy: Decoy, mock_core: ThermocyclerCore, subject: ThermocyclerContext
) -> None:
    """It should get the current cycle index from the core."""
    decoy.when(mock_core.get_current_cycle_index()).then_return(123)
    result = subject.current_cycle_index
    assert result == 123


def test_get_total_step_count(
    decoy: Decoy, mock_core: ThermocyclerCore, subject: ThermocyclerContext
) -> None:
    """It should get the total step count from the core."""
    decoy.when(mock_core.get_total_step_count()).then_return(1337)
    result = subject.total_step_count
    assert result == 1337


def test_get_current_step_index(
    decoy: Decoy, mock_core: ThermocyclerCore, subject: ThermocyclerContext
) -> None:
    """It should get the current step index from the core."""
    decoy.when(mock_core.get_current_step_index()).then_return(42)
    result = subject.current_step_index
    assert result == 42


def test_open_lid(
    decoy: Decoy,
    mock_core: ThermocyclerCore,
    mock_broker: LegacyBroker,
    subject: ThermocyclerContext,
) -> None:
    """It should open the lid via the core."""
    decoy.when(mock_core.open_lid()).then_return(ThermocyclerLidStatus.OPEN)

    result = subject.open_lid()

    decoy.verify(
        mock_broker.publish(
            "command",
            matchers.DictMatching(
                {
                    "$": "before",
                    "name": "command.THERMOCYCLER_OPEN",
                }
            ),
        ),
        mock_broker.publish(
            "command",
            matchers.DictMatching({"$": "after"}),
        ),
    )

    assert result == "open"
    assert isinstance(result, ThermocyclerLidStatus) is False


def test_close_lid(
    decoy: Decoy,
    mock_core: ThermocyclerCore,
    mock_broker: LegacyBroker,
    subject: ThermocyclerContext,
) -> None:
    """It should close the lid via the core."""
    decoy.when(mock_core.close_lid()).then_return(ThermocyclerLidStatus.CLOSED)

    result = subject.close_lid()

    decoy.verify(
        mock_broker.publish(
            "command",
            matchers.DictMatching(
                {
                    "$": "before",
                    "name": "command.THERMOCYCLER_CLOSE",
                }
            ),
        ),
        mock_broker.publish(
            "command",
            matchers.DictMatching({"$": "after"}),
        ),
    )

    assert result == "closed"
    assert isinstance(result, ThermocyclerLidStatus) is False


def test_set_block_temperature(
    decoy: Decoy,
    mock_core: ThermocyclerCore,
    mock_broker: LegacyBroker,
    subject: ThermocyclerContext,
) -> None:
    """It should set the block temperature via the core."""
    decoy.when(
        mock_validation.ensure_hold_time_seconds(seconds=1.2, minutes=3.4)
    ).then_return(5.6)

    subject.set_block_temperature(
        temperature=42.0,
        hold_time_seconds=1.2,
        hold_time_minutes=3.4,
        ramp_rate=5.6,
        block_max_volume=7.8,
    )

    decoy.verify(
        mock_broker.publish(
            "command",
            matchers.DictMatching(
                {
                    "$": "before",
                    "name": "command.THERMOCYCLER_SET_BLOCK_TEMP",
                    "payload": matchers.DictMatching(
                        {"temperature": 42.0, "hold_time": 205.2}
                    ),
                }
            ),
        ),
        mock_core.set_target_block_temperature(
            celsius=42.0,
            hold_time_seconds=5.6,
            block_max_volume=7.8,
        ),
        mock_core.wait_for_block_temperature(),
        mock_broker.publish(
            "command",
            matchers.DictMatching(
                {
                    "$": "after",
                    "payload": matchers.DictMatching(
                        {"temperature": 42.0, "hold_time": 205.2}
                    ),
                }
            ),
        ),
    )


def test_set_lid_temperature(
    decoy: Decoy,
    mock_core: ThermocyclerCore,
    mock_broker: LegacyBroker,
    subject: ThermocyclerContext,
) -> None:
    """It should close the lid via the core."""
    subject.set_lid_temperature(temperature=42.0)

    decoy.verify(
        mock_broker.publish(
            "command",
            matchers.DictMatching(
                {
                    "$": "before",
                    "name": "command.THERMOCYCLER_SET_LID_TEMP",
                }
            ),
        ),
        mock_core.set_target_lid_temperature(celsius=42.0),
        mock_core.wait_for_lid_temperature(),
        mock_broker.publish(
            "command",
            matchers.DictMatching({"$": "after"}),
        ),
    )


def test_execute_profile(
    decoy: Decoy,
    mock_core: ThermocyclerCore,
    mock_broker: LegacyBroker,
    subject: ThermocyclerContext,
) -> None:
    """It should execute a thermocycler profile via the core."""
    decoy.when(mock_validation.ensure_thermocycler_repetition_count(123)).then_return(
        321
    )
    decoy.when(
        mock_validation.ensure_thermocycler_profile_steps(
            [
                {
                    "temperature": 12.3,
                    "hold_time_minutes": 12.3,
                    "hold_time_seconds": 45.6,
                }
            ]
        )
    ).then_return([{"temperature": 42.0, "hold_time_seconds": 123.456}])

    subject.execute_profile(
        steps=[
            {"temperature": 12.3, "hold_time_minutes": 12.3, "hold_time_seconds": 45.6}
        ],
        repetitions=123,
        block_max_volume=34.5,
    )

    decoy.verify(
        mock_broker.publish(
            "command",
            matchers.DictMatching(
                {
                    "$": "before",
                    "name": "command.THERMOCYCLER_EXECUTE_PROFILE",
                    "payload": matchers.DictMatching(
                        {
                            "steps": [
                                {
                                    "temperature": 12.3,
                                    "hold_time_minutes": 12.3,
                                    "hold_time_seconds": 45.6,
                                }
                            ]
                        }
                    ),
                }
            ),
        ),
        mock_core.execute_profile(
            steps=[
                {
                    "temperature": 42.0,
                    "hold_time_seconds": 123.456,
                }
            ],
            repetitions=321,
            block_max_volume=34.5,
        ),
        mock_broker.publish(
            "command",
            matchers.DictMatching(
                {
                    "$": "after",
                    "payload": matchers.DictMatching(
                        {
                            "steps": [
                                {
                                    "temperature": 12.3,
                                    "hold_time_minutes": 12.3,
                                    "hold_time_seconds": 45.6,
                                }
                            ]
                        }
                    ),
                }
            ),
        ),
    )


def test_deactivate_lid(
    decoy: Decoy,
    mock_core: ThermocyclerCore,
    mock_broker: LegacyBroker,
    subject: ThermocyclerContext,
) -> None:
    """It should turn off the heated lid via the core."""
    subject.deactivate_lid()

    decoy.verify(
        mock_broker.publish(
            "command",
            matchers.DictMatching(
                {
                    "$": "before",
                    "name": "command.THERMOCYCLER_DEACTIVATE_LID",
                }
            ),
        ),
        mock_core.deactivate_lid(),
        mock_broker.publish(
            "command",
            matchers.DictMatching({"$": "after"}),
        ),
    )


def test_deactivate_block(
    decoy: Decoy,
    mock_core: ThermocyclerCore,
    mock_broker: LegacyBroker,
    subject: ThermocyclerContext,
) -> None:
    """It should turn off the well block temperature controller via the core."""
    subject.deactivate_block()

    decoy.verify(
        mock_broker.publish(
            "command",
            matchers.DictMatching(
                {
                    "$": "before",
                    "name": "command.THERMOCYCLER_DEACTIVATE_BLOCK",
                }
            ),
        ),
        mock_core.deactivate_block(),
        mock_broker.publish(
            "command",
            matchers.DictMatching({"$": "after"}),
        ),
    )


def test_deactivate(
    decoy: Decoy,
    mock_core: ThermocyclerCore,
    mock_broker: LegacyBroker,
    subject: ThermocyclerContext,
) -> None:
    """It should turn off the well block and heated lid via the core."""
    subject.deactivate()

    decoy.verify(
        mock_broker.publish(
            "command",
            matchers.DictMatching(
                {
                    "$": "before",
                    "name": "command.THERMOCYCLER_DEACTIVATE",
                }
            ),
        ),
        mock_core.deactivate(),
        mock_broker.publish(
            "command",
            matchers.DictMatching({"$": "after"}),
        ),
    )


def test_serial_number(
    decoy: Decoy,
    mock_core: ThermocyclerCore,
    subject: ThermocyclerContext,
) -> None:
    """It should get the module's unique serial number."""
    decoy.when(mock_core.get_serial_number()).then_return("abc-123")
    result = subject.serial_number
    assert result == "abc-123"
