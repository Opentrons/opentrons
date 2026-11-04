"""Tests for Flex Stacker Engine Core."""

import pytest
from decoy import Decoy

from opentrons.hardware_control import SynchronousAdapter
from opentrons.hardware_control.modules import VacuumModule
from opentrons.hardware_control.modules.types import (
    ModuleType,
)
from opentrons.protocol_api import MAX_SUPPORTED_VERSION
from opentrons.protocol_api.core.engine.module_core import VacuumModuleCore
from opentrons.protocol_api.core.engine.protocol import ProtocolCore
from opentrons.protocol_engine import commands as cmd
from opentrons.protocol_engine.clients import SyncClient as EngineClient

SyncVacuumModuleHardware = SynchronousAdapter[VacuumModule]


@pytest.fixture
def mock_engine_client(decoy: Decoy) -> EngineClient:
    """Get a mock ProtocolEngine synchronous client."""
    return decoy.mock(cls=EngineClient)


@pytest.fixture
def mock_sync_module_hardware(decoy: Decoy) -> SyncVacuumModuleHardware:
    """Get a mock synchronous module hardware."""
    return decoy.mock(name="SyncVacuumModuleHardware")  # type: ignore[no-any-return]


@pytest.fixture
def mock_protocol_core(decoy: Decoy) -> ProtocolCore:
    """Get a mock protocol core."""
    mock_protocol_core = decoy.mock(cls=ProtocolCore)
    decoy.when(mock_protocol_core.annotation_ids).then_return([])
    return mock_protocol_core


@pytest.fixture
def subject(
    mock_engine_client: EngineClient,
    mock_sync_module_hardware: SyncVacuumModuleHardware,
    mock_protocol_core: ProtocolCore,
) -> VacuumModuleCore:
    """Get a Vacuum Module Core test subject."""
    return VacuumModuleCore(
        module_id="1234",
        engine_client=mock_engine_client,
        api_version=MAX_SUPPORTED_VERSION,
        sync_module_hardware=mock_sync_module_hardware,
        protocol_core=mock_protocol_core,
    )


def test_create(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_sync_module_hardware: SyncVacuumModuleHardware,
    mock_protocol_core: ProtocolCore,
) -> None:
    """It should be able to create a Vacuum Module core."""
    result = VacuumModuleCore(
        module_id="1234",
        engine_client=mock_engine_client,
        api_version=MAX_SUPPORTED_VERSION,
        sync_module_hardware=mock_sync_module_hardware,
        protocol_core=mock_protocol_core,
    )

    assert result.module_id == "1234"
    assert result.MODULE_TYPE == ModuleType.VACUUM_MODULE


def test_start_set_vacuum_pressure(
    decoy: Decoy, mock_engine_client: EngineClient, subject: VacuumModuleCore
) -> None:
    """It should correctly pass along the parameters to the protocol engine command."""
    gauge_pressure_mbar = -300
    duration_s = 40
    ramp_rate = None
    timeout_s = 100
    vent_after = False

    subject.start_set_vacuum_pressure(
        gauge_pressure_mbar=gauge_pressure_mbar,
        duration=duration_s,
        ramp_rate=ramp_rate,
        timeout_s=timeout_s,
        vent_after=vent_after,
    )
    decoy.verify(
        mock_engine_client.execute_command(
            cmd.vacuum_module.StartSetVacuumPressureParams(
                moduleId="1234",
                gaugePressure=gauge_pressure_mbar,
                duration=duration_s,
                rate=ramp_rate,
                timeout=timeout_s,
                ventAfter=vent_after,
            ),
            command_annotations=[],
        )
    )


def test_start_set_vacuum_power(
    decoy: Decoy, mock_engine_client: EngineClient, subject: VacuumModuleCore
) -> None:
    """It should correctly pass along the parameters to the protocol engine command."""
    percent_power = 75
    duration_s = 39
    ramp_rate = 1.4
    timeout_s = 102
    vent_after = True

    subject.start_set_vacuum_power(
        percent_power=percent_power,
        duration=duration_s,
        ramp_rate=ramp_rate,
        timeout_s=timeout_s,
        vent_after=vent_after,
    )
    decoy.verify(
        mock_engine_client.execute_command(
            cmd.vacuum_module.StartSetVacuumPowerParams(
                moduleId="1234",
                percentPower=percent_power,
                duration=duration_s,
                rate=ramp_rate,
                timeout=timeout_s,
                ventAfter=vent_after,
            ),
            command_annotations=[],
        )
    )


def test_stop_vacuum(
    decoy: Decoy, mock_engine_client: EngineClient, subject: VacuumModuleCore
) -> None:
    """Verify that the protocol engine command gets called correctly.."""
    subject.stop_vacuum()
    decoy.verify(
        mock_engine_client.execute_command(
            cmd.vacuum_module.StopVacuumParams(
                moduleId="1234",
            ),
            command_annotations=[],
        )
    )
