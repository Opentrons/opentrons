"""Tests for the engine based Protocol API module core implementations."""

import pytest
from decoy import Decoy

from opentrons.hardware_control import SynchronousAdapter
from opentrons.hardware_control.modules import AbsorbanceReader
from opentrons.hardware_control.modules.types import (
    ModuleType,
)
from opentrons.protocol_api import MAX_SUPPORTED_VERSION
from opentrons.protocol_api.core.engine.module_core import AbsorbanceReaderCore
from opentrons.protocol_api.core.engine.protocol import ProtocolCore
from opentrons.protocol_engine import commands as cmd
from opentrons.protocol_engine.clients import SyncClient as EngineClient
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
def mock_protocol_core(decoy: Decoy) -> ProtocolCore:
    """Get a mock protocol core."""
    return decoy.mock(cls=ProtocolCore)


@pytest.fixture
def subject(
    mock_engine_client: EngineClient,
    mock_sync_module_hardware: SyncAbsorbanceReaderHardware,
    mock_protocol_core: ProtocolCore,
) -> AbsorbanceReaderCore:
    """Get a AbsorbanceReaderCore test subject."""
    return AbsorbanceReaderCore(
        module_id="1234",
        engine_client=mock_engine_client,
        api_version=MAX_SUPPORTED_VERSION,
        sync_module_hardware=mock_sync_module_hardware,
        protocol_core=mock_protocol_core,
    )


def test_create(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_sync_module_hardware: SyncAbsorbanceReaderHardware,
    mock_protocol_core: ProtocolCore,
) -> None:
    """It should be able to create an absorbance plate reader module core."""
    result = AbsorbanceReaderCore(
        module_id="1234",
        engine_client=mock_engine_client,
        api_version=MAX_SUPPORTED_VERSION,
        sync_module_hardware=mock_sync_module_hardware,
        protocol_core=mock_protocol_core,
    )

    assert result.module_id == "1234"
    assert result.MODULE_TYPE == ModuleType.ABSORBANCE_READER


def test_initialize(
    decoy: Decoy, mock_engine_client: EngineClient, subject: AbsorbanceReaderCore
) -> None:
    """It should set the sample wavelength with the engine client."""
    subject._ready_to_initialize = True
    subject.initialize("single", [350])

    decoy.verify(
        mock_engine_client.execute_command(
            cmd.absorbance_reader.InitializeParams(
                moduleId="1234",
                measureMode="single",
                sampleWavelengths=[350],
                referenceWavelength=None,
            ),
        ),
        times=1,
    )
    assert subject._initialized_value == [350]

    # Test reference wavelength
    subject.initialize("single", [350], 450)

    decoy.verify(
        mock_engine_client.execute_command(
            cmd.absorbance_reader.InitializeParams(
                moduleId="1234",
                measureMode="single",
                sampleWavelengths=[350],
                referenceWavelength=450,
            ),
        ),
        times=1,
    )
    assert subject._initialized_value == [350]

    # Test initialize multi
    subject.initialize("multi", [350, 400, 450])

    decoy.verify(
        mock_engine_client.execute_command(
            cmd.absorbance_reader.InitializeParams(
                moduleId="1234",
                measureMode="multi",
                sampleWavelengths=[350, 400, 450],
                referenceWavelength=None,
            ),
        ),
        times=1,
    )
    assert subject._initialized_value == [350, 400, 450]


def test_initialize_not_ready(subject: AbsorbanceReaderCore) -> None:
    """It should raise CannotPerformModuleAction if you dont call .close_lid() command."""
    subject._ready_to_initialize = False
    with pytest.raises(CannotPerformModuleAction):
        subject.initialize("single", [350])


@pytest.mark.parametrize("wavelength", [-350, 0, 1200, "wda"])
def test_invalid_wavelengths(wavelength: int, subject: AbsorbanceReaderCore) -> None:
    """It should raise ValueError if you provide an invalid wavelengthi."""
    subject._ready_to_initialize = True
    with pytest.raises(ValueError):
        subject.initialize("single", [wavelength])


def test_read(
    decoy: Decoy, mock_engine_client: EngineClient, subject: AbsorbanceReaderCore
) -> None:
    """It should call absorbance reader to read with the engine client."""
    subject._ready_to_initialize = True
    subject._initialized_value = [350]
    substate = AbsorbanceReaderSubState(
        module_id=AbsorbanceReaderId(subject.module_id),
        configured=True,
        measured=False,
        is_lid_on=True,
        data=None,
        configured_wavelengths=subject._initialized_value,
        measure_mode=AbsorbanceReaderMeasureMode("single"),
        reference_wavelength=None,
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
                fileName=None,
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
