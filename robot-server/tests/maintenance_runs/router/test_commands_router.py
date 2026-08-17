"""Tests for the /maintenance_runs/.../commands routes."""

from datetime import datetime

import pytest
from decoy import Decoy, matchers

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.types import DoorState
from opentrons.protocol_engine import (
    CommandPointer,
    CommandSlice,
)
from opentrons.protocol_engine import (
    commands as pe_commands,
)
from opentrons.protocol_engine import (
    errors as pe_errors,
)
from opentrons.protocol_engine.errors import CommandDoesNotExistError
from server_utils.fastapi_utils.models.json_api import MultiBodyMeta, RequestModel

from robot_server.errors.error_responses import ApiError
from robot_server.maintenance_runs.maintenance_run_data_manager import (
    MaintenanceRunDataManager,
)
from robot_server.maintenance_runs.maintenance_run_models import (
    MaintenanceRunNotFoundError,
)
from robot_server.maintenance_runs.maintenance_run_orchestrator_store import (
    MaintenanceRunOrchestratorStore,
)
from robot_server.maintenance_runs.router.commands_router import (
    create_run_command,
    get_current_run_from_url,
    get_run_command,
    get_run_commands,
)
from robot_server.runs.command_models import (
    CommandCollectionLinks,
    CommandLink,
    CommandLinkMeta,
)
from robot_server.runs.run_models import RunCommandSummary


async def test_get_current_run_from_url(
    decoy: Decoy,
    mock_maintenance_run_orchestrator_store: MaintenanceRunOrchestratorStore,
) -> None:
    """Should get an instance of a maintenance run protocol engine."""
    decoy.when(mock_maintenance_run_orchestrator_store.current_run_id).then_return(
        "run-id"
    )

    result = await get_current_run_from_url(
        runId="run-id",
        run_orchestrator_store=mock_maintenance_run_orchestrator_store,
    )

    assert result == "run-id"


async def test_get_current_run_from_url_not_current(
    decoy: Decoy,
    mock_maintenance_run_orchestrator_store: MaintenanceRunOrchestratorStore,
) -> None:
    """It should 404 if you try to add commands to non-current/non-existent run."""
    decoy.when(mock_maintenance_run_orchestrator_store.current_run_id).then_return(
        "some-other-run-id"
    )

    with pytest.raises(ApiError) as exc_info:
        await get_current_run_from_url(
            runId="run-id",
            run_orchestrator_store=mock_maintenance_run_orchestrator_store,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "RunNotFound"


async def test_create_run_command(
    decoy: Decoy,
    mock_maintenance_run_orchestrator_store: MaintenanceRunOrchestratorStore,
    mock_hardware_api: HardwareControlAPI,
) -> None:
    """It should add the requested command to the ProtocolEngine and return it."""
    command_request = pe_commands.WaitForResumeCreate(
        params=pe_commands.WaitForResumeParams(message="Hello")
    )

    command_once_added = pe_commands.WaitForResume(
        id="command-id",
        key="command-key",
        createdAt=datetime(year=2021, month=1, day=1),
        status=pe_commands.CommandStatus.QUEUED,
        params=pe_commands.WaitForResumeParams(message="Hello"),
    )

    decoy.when(mock_hardware_api.door_state).then_return(DoorState.CLOSED)

    decoy.when(
        await mock_maintenance_run_orchestrator_store.add_command_and_wait_for_interval(
            request=pe_commands.WaitForResumeCreate(
                params=pe_commands.WaitForResumeParams(message="Hello"),
                intent=pe_commands.CommandIntent.SETUP,
            ),
            wait_until_complete=False,
            timeout=None,
        )
    ).then_return(command_once_added)

    decoy.when(
        await mock_maintenance_run_orchestrator_store.get_command("command-id")
    ).then_return(command_once_added)

    result = await create_run_command(
        run_id="run-id",
        request_body=RequestModel(data=command_request),
        waitUntilComplete=False,
        run_orchestrator_store=mock_maintenance_run_orchestrator_store,
        timeout=None,
        check_estop=True,
        hardware=mock_hardware_api,
    )

    assert result.content.data == command_once_added
    assert result.status_code == 201


async def test_create_run_command_blocking_completion(
    decoy: Decoy,
    mock_maintenance_run_orchestrator_store: MaintenanceRunOrchestratorStore,
    mock_hardware_api: HardwareControlAPI,
) -> None:
    """It should be able to create a command and wait for it to execute."""
    command_request = pe_commands.WaitForResumeCreate(
        params=pe_commands.WaitForResumeParams(message="Hello"),
        intent=pe_commands.CommandIntent.SETUP,
    )

    command_once_completed = pe_commands.WaitForResume(
        id="command-id",
        key="command-key",
        createdAt=datetime(year=2021, month=1, day=1),
        status=pe_commands.CommandStatus.SUCCEEDED,
        params=pe_commands.WaitForResumeParams(message="Hello"),
        result=pe_commands.WaitForResumeResult(),
    )

    decoy.when(mock_hardware_api.door_state).then_return(DoorState.CLOSED)

    decoy.when(
        await mock_maintenance_run_orchestrator_store.add_command_and_wait_for_interval(
            request=command_request, wait_until_complete=True, timeout=999
        )
    ).then_return(command_once_completed)

    decoy.when(
        await mock_maintenance_run_orchestrator_store.get_command("command-id")
    ).then_return(command_once_completed)

    result = await create_run_command(
        run_id="run-id",
        request_body=RequestModel(data=command_request),
        waitUntilComplete=True,
        timeout=999,
        run_orchestrator_store=mock_maintenance_run_orchestrator_store,
        check_estop=True,
        hardware=mock_hardware_api,
    )

    assert result.content.data == command_once_completed
    assert result.status_code == 201


async def test_create_run_command_door_open_blocks_by_default(
    decoy: Decoy,
    mock_maintenance_run_orchestrator_store: MaintenanceRunOrchestratorStore,
    mock_hardware_api: HardwareControlAPI,
) -> None:
    """It should return a 409 by default when the door is open."""
    command_request = pe_commands.HomeCreate(params=pe_commands.HomeParams())

    decoy.when(mock_hardware_api.door_state).then_return(DoorState.OPEN)

    with pytest.raises(ApiError) as exc_info:
        await create_run_command(
            run_id="run-id",
            request_body=RequestModel(data=command_request),
            waitUntilComplete=False,
            run_orchestrator_store=mock_maintenance_run_orchestrator_store,
            timeout=None,
            check_estop=True,
            hardware=mock_hardware_api,
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.content["errors"][0]["id"] == "MaintenanceCommandDoorOpen"


async def test_create_run_command_door_open_allows_when_opted_out(
    decoy: Decoy,
    mock_maintenance_run_orchestrator_store: MaintenanceRunOrchestratorStore,
    mock_hardware_api: HardwareControlAPI,
) -> None:
    """It should allow commands through when requiresClosedDoor is False, even if the door is open."""
    command_request = pe_commands.HomeCreate(params=pe_commands.HomeParams())

    command_once_added = pe_commands.Home(
        id="command-id",
        key="command-key",
        createdAt=datetime(year=2021, month=1, day=1),
        status=pe_commands.CommandStatus.QUEUED,
        params=pe_commands.HomeParams(),
    )

    decoy.when(mock_hardware_api.door_state).then_return(DoorState.OPEN)

    decoy.when(
        await mock_maintenance_run_orchestrator_store.add_command_and_wait_for_interval(
            request=pe_commands.HomeCreate(
                params=pe_commands.HomeParams(),
                intent=pe_commands.CommandIntent.SETUP,
            ),
            wait_until_complete=False,
            timeout=None,
        )
    ).then_return(command_once_added)

    decoy.when(
        await mock_maintenance_run_orchestrator_store.get_command("command-id")
    ).then_return(command_once_added)

    result = await create_run_command(
        run_id="run-id",
        request_body=RequestModel(data=command_request),
        waitUntilComplete=False,
        run_orchestrator_store=mock_maintenance_run_orchestrator_store,
        timeout=None,
        check_estop=True,
        hardware=mock_hardware_api,
        requiresClosedDoor=False,
    )

    assert result.content.data == command_once_added
    assert result.status_code == 201


async def test_get_run_commands(
    decoy: Decoy, mock_maintenance_run_data_manager: MaintenanceRunDataManager
) -> None:
    """It should return a list of all commands in a run."""
    command = pe_commands.WaitForResume(
        id="command-id",
        key="command-key",
        intent=pe_commands.CommandIntent.PROTOCOL,
        status=pe_commands.CommandStatus.FAILED,
        createdAt=datetime(year=2021, month=1, day=1),
        startedAt=datetime(year=2022, month=2, day=2),
        completedAt=datetime(year=2023, month=3, day=3),
        params=pe_commands.WaitForResumeParams(message="hello world"),
        error=pe_errors.ErrorOccurrence(
            id="error-id",
            errorType="PrettyBadError",
            createdAt=datetime(year=2024, month=4, day=4),
            detail="Things are not looking good.",
        ),
        failedCommandId="failed-command-id",
    )

    decoy.when(
        await mock_maintenance_run_data_manager.get_current_command("run-id")
    ).then_return(
        CommandPointer(
            command_id="current-command-id",
            command_key="current-command-key",
            created_at=datetime(year=2024, month=4, day=4),
            index=101,
        )
    )
    decoy.when(
        await mock_maintenance_run_data_manager.get_recovery_target_command("run-id")
    ).then_return(
        CommandPointer(
            command_id="recovery-target-command-id",
            command_key="recovery-target-command-key",
            created_at=datetime(year=2025, month=5, day=5),
            index=202,
        )
    )

    decoy.when(
        await mock_maintenance_run_data_manager.get_commands_slice(
            run_id="run-id",
            cursor=None,
            length=42,
        )
    ).then_return(CommandSlice(commands=[command], cursor=1, total_length=3))

    result = await get_run_commands(
        runId="run-id",
        run_data_manager=mock_maintenance_run_data_manager,
        cursor=None,
        pageLength=42,
    )

    assert result.content.data == [
        RunCommandSummary(
            id="command-id",
            key="command-key",
            commandType="waitForResume",
            intent=pe_commands.CommandIntent.PROTOCOL,
            createdAt=datetime(year=2021, month=1, day=1),
            startedAt=datetime(year=2022, month=2, day=2),
            completedAt=datetime(year=2023, month=3, day=3),
            status=pe_commands.CommandStatus.FAILED,
            params=pe_commands.WaitForResumeParams(message="hello world"),
            error=pe_errors.ErrorOccurrence(
                id="error-id",
                errorType="PrettyBadError",
                createdAt=datetime(year=2024, month=4, day=4),
                detail="Things are not looking good.",
            ),
            failedCommandId="failed-command-id",
        )
    ]
    assert result.content.meta == MultiBodyMeta(cursor=1, totalLength=3)
    assert result.content.links == CommandCollectionLinks(
        current=CommandLink(
            href="/maintenance_runs/run-id/commands/current-command-id",
            meta=CommandLinkMeta(
                runId="run-id",
                commandId="current-command-id",
                key="current-command-key",
                createdAt=datetime(year=2024, month=4, day=4),
                index=101,
            ),
        ),
        currentlyRecoveringFrom=CommandLink(
            href="/maintenance_runs/run-id/commands/recovery-target-command-id",
            meta=CommandLinkMeta(
                runId="run-id",
                commandId="recovery-target-command-id",
                key="recovery-target-command-key",
                createdAt=datetime(year=2025, month=5, day=5),
                index=202,
            ),
        ),
    )
    assert result.status_code == 200


async def test_get_run_commands_empty(
    decoy: Decoy,
    mock_maintenance_run_data_manager: MaintenanceRunDataManager,
) -> None:
    """It should return an empty commands list if no commands."""
    decoy.when(
        await mock_maintenance_run_data_manager.get_current_command("run-id")
    ).then_return(None)
    decoy.when(
        await mock_maintenance_run_data_manager.get_commands_slice(
            run_id="run-id", cursor=21, length=42
        )
    ).then_return(CommandSlice(commands=[], cursor=0, total_length=0))

    result = await get_run_commands(
        runId="run-id",
        run_data_manager=mock_maintenance_run_data_manager,
        cursor=21,
        pageLength=42,
    )

    assert result.content.data == []
    assert result.content.meta == MultiBodyMeta(cursor=0, totalLength=0)
    assert result.content.links == CommandCollectionLinks(current=None)
    assert result.status_code == 200


async def test_get_run_commands_not_found(
    decoy: Decoy,
    mock_maintenance_run_data_manager: MaintenanceRunDataManager,
) -> None:
    """It should 404 if the run is not found."""
    not_found_error = MaintenanceRunNotFoundError("oh no")

    decoy.when(
        await mock_maintenance_run_data_manager.get_commands_slice(
            run_id="run-id", cursor=21, length=42
        )
    ).then_raise(not_found_error)
    decoy.when(
        mock_maintenance_run_data_manager.get_current_command(run_id="run-id")
    ).then_raise(not_found_error)

    with pytest.raises(ApiError) as exc_info:
        await get_run_commands(
            runId="run-id",
            run_data_manager=mock_maintenance_run_data_manager,
            cursor=21,
            pageLength=42,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "RunNotFound"


async def test_get_run_command_by_id(
    decoy: Decoy, mock_maintenance_run_data_manager: MaintenanceRunDataManager
) -> None:
    """It should return full details about a command by ID."""
    command = pe_commands.MoveToWell(
        id="command-id",
        key="command-key",
        status=pe_commands.CommandStatus.RUNNING,
        createdAt=datetime(year=2022, month=2, day=2),
        params=pe_commands.MoveToWellParams(pipetteId="a", labwareId="b", wellName="c"),
    )

    decoy.when(
        await mock_maintenance_run_data_manager.get_command("run-id", "command-id")
    ).then_return(command)

    result = await get_run_command(
        runId="run-id",
        commandId="command-id",
        run_data_manager=mock_maintenance_run_data_manager,
    )

    assert result.content.data == command
    assert result.status_code == 200


@pytest.mark.parametrize(
    "exception",
    [
        CommandDoesNotExistError("oh no"),
        MaintenanceRunNotFoundError("oh no"),
    ],
)
async def test_get_run_command_missing(
    decoy: Decoy,
    mock_maintenance_run_data_manager: MaintenanceRunDataManager,
    exception: Exception,
) -> None:
    """It should 404 if you attempt to get a non-existent command."""
    decoy.when(
        await mock_maintenance_run_data_manager.get_command(
            run_id="run-id", command_id="command-id"
        )
    ).then_raise(exception)

    with pytest.raises(ApiError) as exc_info:
        await get_run_command(
            runId="run-id",
            commandId="command-id",
            run_data_manager=mock_maintenance_run_data_manager,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["detail"] == matchers.StringMatching(
        "oh no"
    )
