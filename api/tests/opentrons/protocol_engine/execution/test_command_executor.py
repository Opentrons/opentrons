"""Test CommandExecutor routing to command implementation providers."""
import pytest
from dataclasses import dataclass
from datetime import datetime
from mock import AsyncMock  # type: ignore[attr-defined]
from typing import Any, Optional, cast

from opentrons.types import MountType
from opentrons.protocol_engine import errors, command_models as cmd
from opentrons.protocol_engine.execution import CommandExecutor
from opentrons.protocol_engine.execution.equipment import EquipmentHandler
from opentrons.protocol_engine.execution.pipetting import PipettingHandler


@pytest.fixture
def mock_equipment_handler() -> AsyncMock:
    return AsyncMock(spec=EquipmentHandler)


@pytest.fixture
def mock_pipetting_handler() -> AsyncMock:
    return AsyncMock(spec=PipettingHandler)


@pytest.fixture
def executor(
    mock_equipment_handler: AsyncMock,
    mock_pipetting_handler: AsyncMock,
) -> CommandExecutor:
    return CommandExecutor(
        equipment_handler=mock_equipment_handler,
        pipetting_handler=mock_pipetting_handler
    )


@dataclass(frozen=True)
class ExecutorRoutingSpec():
    name: str
    request: cmd.CommandRequestType
    expected_handler: str
    expected_method: str
    result: Optional[cmd.CommandResultType] = None
    error: Optional[errors.ProtocolEngineError] = None


@pytest.mark.parametrize(
    "spec",
    [
        ExecutorRoutingSpec(
            name="Successful load labware",
            request=cmd.LoadLabwareRequest(
                location=1,
                loadName="load-name",
                namespace="opentrons-test",
                version=1,
            ),
            result=cmd.LoadLabwareResult(
                labwareId='unique-id',
                definition=cast(Any, {"mock_definition": True}),
                calibration=(1, 2, 3)
            ),
            expected_handler="equipment_handler",
            expected_method="handle_load_labware"
        ),
        ExecutorRoutingSpec(
            name="Successful load pipette",
            request=cmd.LoadPipetteRequest(
                pipetteName="p300_single",
                mount=MountType.LEFT,
            ),
            result=cmd.LoadPipetteResult(pipetteId='unique-id'),
            expected_handler="equipment_handler",
            expected_method="handle_load_pipette"
        ),
        ExecutorRoutingSpec(
            name="Failed load pipette",
            request=cmd.LoadPipetteRequest(
                pipetteName="p300_single",
                mount=MountType.LEFT,
            ),
            error=errors.FailedToLoadPipetteError("oh no"),
            expected_handler="equipment_handler",
            expected_method="handle_load_pipette"
        ),
        ExecutorRoutingSpec(
            name="Successful move to well",
            request=cmd.MoveToWellRequest(
                pipetteId="pipette-id",
                labwareId="labware-id",
                wellId="A1",
            ),
            result=cmd.MoveToWellResult(),
            expected_handler="pipetting_handler",
            expected_method="handle_move_to_well"
        ),
        ExecutorRoutingSpec(
            name="Failed move to well",
            request=cmd.MoveToWellRequest(
                pipetteId="pipette-id",
                labwareId="labware-id",
                wellId="A1",
            ),
            error=errors.WellDoesNotExistError("oh no"),
            expected_handler="pipetting_handler",
            expected_method="handle_move_to_well"
        ),
    ]
)
async def test_command_executor_routing(
    executor: CommandExecutor,
    mock_equipment_handler: AsyncMock,
    mock_pipetting_handler: AsyncMock,
    now: datetime,
    spec: ExecutorRoutingSpec,
) -> None:
    HANDLER_NAME_MAP = {
        "equipment_handler": mock_equipment_handler,
        "pipetting_handler": mock_pipetting_handler,
    }

    req = spec.request
    res = spec.result
    err = spec.error

    assert res is not None or err is not None, "result or error must be spec'd"

    mock_handler = getattr(
        HANDLER_NAME_MAP[spec.expected_handler],
        spec.expected_method
    )

    if res is not None:
        mock_handler.return_value = spec.result
    else:
        mock_handler.side_effect = spec.error

    running_cmd: Any = cmd.RunningCommand(
        request=req,
        created_at=now,
        started_at=now
    )

    completed_or_failed_cmd: Any = await executor.execute_command(running_cmd)

    mock_handler.assert_called_with(req)

    if res is not None:
        assert type(completed_or_failed_cmd) == cmd.CompletedCommand
        assert completed_or_failed_cmd.result == res
    else:
        assert type(completed_or_failed_cmd) == cmd.FailedCommand
        assert completed_or_failed_cmd.error == err


async def test_executor_handles_unexpected_error(
    executor: CommandExecutor,
    mock_equipment_handler: AsyncMock,
    now: datetime,
) -> None:
    """CommandExecutor should handle unexpected errors."""
    error = RuntimeError('I did not see this coming')
    mock_equipment_handler.handle_load_labware.side_effect = error

    failed_cmd: Any = await executor.execute_command(
        cmd.RunningCommand[cmd.LoadLabwareRequest, cmd.LoadLabwareResult](
            created_at=now,
            started_at=now,
            request=cmd.LoadLabwareRequest(
                location=1,
                loadName="load-name",
                namespace="opentrons-test",
                version=1,
            ),
        ),
    )

    assert type(failed_cmd) == cmd.FailedCommand
    assert type(failed_cmd.error) == errors.UnexpectedProtocolError
    assert str(failed_cmd.error) == str(error)
