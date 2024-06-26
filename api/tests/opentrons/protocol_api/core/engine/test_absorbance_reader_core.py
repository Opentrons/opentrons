"""Tests for the engine based Protocol API module core implementations."""
import pytest
from decoy import Decoy

from opentrons.hardware_control import SynchronousAdapter
from opentrons.hardware_control.modules import AbsorbanceReader
from opentrons.hardware_control.modules.types import (
    ModuleType,
)
from opentrons.protocol_engine import commands as cmd
from opentrons.protocol_engine.clients import SyncClient as EngineClient
from opentrons.protocol_api.core.engine.module_core import AbsorbanceReaderCore
from opentrons.protocol_api import MAX_SUPPORTED_VERSION

SyncAbsorbanceReaderHardware = SynchronousAdapter[AbsorbanceReader]


@pytest.fixture
def mock_engine_client(decoy: Decoy) -> EngineClient:
    """Get a mock ProtocolEngine synchronous client."""
    return decoy.mock(cls=EngineClient)


@pytest.fixture
def mock_sync_module_hardware(decoy: Decoy) -> SyncAbsorbanceReaderHardware:
    """Get a mock synchronous module hardware."""
    return decoy.mock(name="SyncAbsorbanceReaderHardware")  # type: ignore[no-any-return]


@pytest.fixture
def subject(
    mock_engine_client: EngineClient,
    mock_sync_module_hardware: SyncAbsorbanceReaderHardware,
) -> AbsorbanceReaderCore:
    """Get a AbsorbanceReaderCore test subject."""
    return AbsorbanceReaderCore(
        module_id="1234",
        engine_client=mock_engine_client,
        api_version=MAX_SUPPORTED_VERSION,
        sync_module_hardware=mock_sync_module_hardware,
    )


def test_create(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_sync_module_hardware: SyncAbsorbanceReaderHardware,
) -> None:
    """It should be able to create an absorbance plate reader module core."""
    result = AbsorbanceReaderCore(
        module_id="1234",
        engine_client=mock_engine_client,
        api_version=MAX_SUPPORTED_VERSION,
        sync_module_hardware=mock_sync_module_hardware,
    )

    assert result.module_id == "1234"
    assert result.MODULE_TYPE == ModuleType.ABSORBANCE_READER


def test_initialize(
    decoy: Decoy, mock_engine_client: EngineClient, subject: AbsorbanceReaderCore
) -> None:
    """It should set the sample wavelength with the engine client."""
    subject.initialize(wavelength=123)

    decoy.verify(
        mock_engine_client.execute_command(
            cmd.absorbance_reader.InitializeParams(
                moduleId="1234",
                sampleWavelength=123,
            ),
        ),
        times=1,
    )
    assert subject._initialized_value == 123


def test_initiate_read(
    decoy: Decoy, mock_engine_client: EngineClient, subject: AbsorbanceReaderCore
) -> None:
    """It should call absorbance reader to read with the engine client."""
    subject._initialized_value = 123
    subject.initiate_read()

    decoy.verify(
        mock_engine_client.execute_command(
            cmd.absorbance_reader.MeasureAbsorbanceParams(
                moduleId="1234",
                sampleWavelength=123,
            ),
        ),
        times=1,
    )


def test_get_serial_number(
    decoy: Decoy, subject: AbsorbanceReaderCore, mock_engine_client: EngineClient
) -> None:
    """It should return a serial number."""
    decoy.when(mock_engine_client.state.modules.get_serial_number("1234")).then_return(
        "abc"
    )

    assert subject.get_serial_number() == "abc"
