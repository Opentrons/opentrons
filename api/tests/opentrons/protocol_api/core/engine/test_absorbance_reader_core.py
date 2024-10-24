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
from opentrons.protocol_engine.errors.exceptions import CannotPerformModuleAction
from opentrons.protocol_engine.state.module_substates import AbsorbanceReaderSubState
from opentrons.protocol_engine.state.module_substates.absorbance_reader_substate import (
    AbsorbanceReaderId,
    AbsorbanceReaderMeasureMode,
)

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
    subject._ready_to_initialize = True
    subject.initialize("single", [123])

    decoy.verify(
        mock_engine_client.execute_command(
            cmd.absorbance_reader.InitializeParams(
                moduleId="1234",
                measureMode="single",
                sampleWavelengths=[123],
                referenceWavelength=None,
            ),
        ),
        times=1,
    )
    assert subject._initialized_value == [123]

    # Test reference wavelength
    subject.initialize("single", [124], 450)

    decoy.verify(
        mock_engine_client.execute_command(
            cmd.absorbance_reader.InitializeParams(
                moduleId="1234",
                measureMode="single",
                sampleWavelengths=[124],
                referenceWavelength=450,
            ),
        ),
        times=1,
    )
    assert subject._initialized_value == [124]

    # Test initialize multi
    subject.initialize("multi", [124, 125, 126])

    decoy.verify(
        mock_engine_client.execute_command(
            cmd.absorbance_reader.InitializeParams(
                moduleId="1234",
                measureMode="multi",
                sampleWavelengths=[124, 125, 126],
                referenceWavelength=None,
            ),
        ),
        times=1,
    )
    assert subject._initialized_value == [124, 125, 126]


def test_initialize_not_ready(
    subject: AbsorbanceReaderCore
) -> None:
    """It should raise CannotPerformModuleAction if you dont call .close_lid() command."""
    subject._ready_to_initialize = False
    with pytest.raises(CannotPerformModuleAction):
        subject.initialize("single", [123])


def test_read(
    decoy: Decoy, mock_engine_client: EngineClient, subject: AbsorbanceReaderCore
) -> None:
    """It should call absorbance reader to read with the engine client."""
    subject._ready_to_initialize = True
    subject._initialized_value = [123]
    substate = AbsorbanceReaderSubState(
        module_id=AbsorbanceReaderId(subject.module_id),
        configured=True,
        measured=False,
        is_lid_on=True,
        data=None,
        configured_wavelengths=subject._initialized_value,
        measure_mode=AbsorbanceReaderMeasureMode("single"),
        reference_wavelength=None,
        lid_id="pr_lid_labware",
    )
    decoy.when(
        mock_engine_client.state.modules.get_absorbance_reader_substate(
            subject.module_id
        )
    ).then_return(substate)
    subject.read(filename=None)

    decoy.verify(
        mock_engine_client.execute_command(
            cmd.absorbance_reader.ReadAbsorbanceParams(
                moduleId="1234",
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
