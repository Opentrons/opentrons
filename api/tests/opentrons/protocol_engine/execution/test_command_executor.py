"""Smoke tests for the CommandExecutor class."""
import asyncio
from datetime import datetime
from typing import Any, Optional, Type, cast

import pytest
from decoy import Decoy, matchers
from pydantic import BaseModel

from opentrons.hardware_control import HardwareControlAPI, OT2HardwareControlAPI

from opentrons.protocol_engine import errors
from opentrons.protocol_engine.errors.exceptions import (
    EStopActivatedError as PE_EStopActivatedError,
)
from opentrons.protocol_engine.resources import ModelUtils
from opentrons.protocol_engine.state import StateStore
from opentrons.protocol_engine.actions import (
    ActionDispatcher,
    UpdateCommandAction,
    FailCommandAction,
)

from opentrons.protocol_engine.commands import (
    AbstractCommandImpl,
    BaseCommand,
    CommandStatus,
    Command,
)

from opentrons.protocol_engine.execution import (
    CommandExecutor,
    EquipmentHandler,
    MovementHandler,
    GantryMover,
    LabwareMovementHandler,
    PipettingHandler,
    TipHandler,
    RunControlHandler,
    RailLightsHandler,
    StatusBarHandler,
)

from opentrons_shared_data.errors.exceptions import EStopActivatedError, PythonException


@pytest.fixture
def hardware_api(decoy: Decoy) -> HardwareControlAPI:
    """Get a mocked out StateStore."""
    return decoy.mock(cls=OT2HardwareControlAPI)


@pytest.fixture
def state_store(decoy: Decoy) -> StateStore:
    """Get a mocked out StateStore."""
    return decoy.mock(cls=StateStore)


@pytest.fixture
def action_dispatcher(decoy: Decoy) -> ActionDispatcher:
    """Get a mocked out ActionDispatcher."""
    return decoy.mock(cls=ActionDispatcher)


@pytest.fixture
def equipment(decoy: Decoy) -> EquipmentHandler:
    """Get a mocked out EquipmentHandler."""
    return decoy.mock(cls=EquipmentHandler)


@pytest.fixture
def movement(decoy: Decoy) -> MovementHandler:
    """Get a mocked out MovementHandler."""
    return decoy.mock(cls=MovementHandler)


@pytest.fixture
def mock_gantry_mover(decoy: Decoy) -> GantryMover:
    """Get a mocked out GantryMover."""
    return decoy.mock(cls=GantryMover)


@pytest.fixture
def labware_movement(decoy: Decoy) -> LabwareMovementHandler:
    """Get a mocked out LabwareMovementHandler."""
    return decoy.mock(cls=LabwareMovementHandler)


@pytest.fixture
def pipetting(decoy: Decoy) -> PipettingHandler:
    """Get a mocked out PipettingHandler."""
    return decoy.mock(cls=PipettingHandler)


@pytest.fixture
def mock_tip_handler(decoy: Decoy) -> TipHandler:
    """Get a mocked out TipHandler."""
    return decoy.mock(cls=TipHandler)


@pytest.fixture
def run_control(decoy: Decoy) -> RunControlHandler:
    """Get a mocked out RunControlHandler."""
    return decoy.mock(cls=RunControlHandler)


@pytest.fixture
def model_utils(decoy: Decoy) -> ModelUtils:
    """Get a mocked out ModelUtils."""
    return decoy.mock(cls=ModelUtils)


@pytest.fixture
def rail_lights(decoy: Decoy) -> RailLightsHandler:
    """Get a mocked out RunControlHandler."""
    return decoy.mock(cls=RailLightsHandler)


@pytest.fixture
def status_bar(decoy: Decoy) -> StatusBarHandler:
    """Get a mocked out StatusBarHandler."""
    return decoy.mock(cls=StatusBarHandler)


@pytest.fixture
def subject(
    hardware_api: HardwareControlAPI,
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
    equipment: EquipmentHandler,
    movement: MovementHandler,
    mock_gantry_mover: GantryMover,
    labware_movement: LabwareMovementHandler,
    pipetting: PipettingHandler,
    mock_tip_handler: TipHandler,
    run_control: RunControlHandler,
    rail_lights: RailLightsHandler,
    status_bar: StatusBarHandler,
    model_utils: ModelUtils,
) -> CommandExecutor:
    """Get a CommandExecutor test subject with its dependencies mocked out."""
    return CommandExecutor(
        hardware_api=hardware_api,
        state_store=state_store,
        action_dispatcher=action_dispatcher,
        equipment=equipment,
        movement=movement,
        gantry_mover=mock_gantry_mover,
        labware_movement=labware_movement,
        pipetting=pipetting,
        tip_handler=mock_tip_handler,
        run_control=run_control,
        model_utils=model_utils,
        rail_lights=rail_lights,
        status_bar=status_bar,
    )


class _TestCommandParams(BaseModel):
    foo: str = "foo"


class _TestCommandResult(BaseModel):
    bar: str = "bar"


class _TestCommandImpl(AbstractCommandImpl[_TestCommandParams, _TestCommandResult]):
    async def execute(self, params: _TestCommandParams) -> _TestCommandResult:
        raise NotImplementedError()


async def test_execute(
    decoy: Decoy,
    hardware_api: HardwareControlAPI,
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
    equipment: EquipmentHandler,
    movement: MovementHandler,
    mock_gantry_mover: GantryMover,
    labware_movement: LabwareMovementHandler,
    pipetting: PipettingHandler,
    mock_tip_handler: TipHandler,
    run_control: RunControlHandler,
    rail_lights: RailLightsHandler,
    status_bar: StatusBarHandler,
    model_utils: ModelUtils,
    subject: CommandExecutor,
) -> None:
    """It should be able to execute a command."""
    TestCommandImplCls = decoy.mock(func=_TestCommandImpl)
    command_impl = decoy.mock(cls=_TestCommandImpl)

    class _TestCommand(BaseCommand[_TestCommandParams, _TestCommandResult]):
        commandType: str = "testCommand"
        params: _TestCommandParams
        result: Optional[_TestCommandResult]

        @property
        def _ImplementationCls(self) -> Type[_TestCommandImpl]:
            return TestCommandImplCls

    command_params = _TestCommandParams()
    command_result = _TestCommandResult()

    queued_command = cast(
        Command,
        _TestCommand(
            id="command-id",
            key="command-key",
            createdAt=datetime(year=2021, month=1, day=1),
            status=CommandStatus.QUEUED,
            params=command_params,
        ),
    )

    running_command = cast(
        Command,
        _TestCommand(
            id="command-id",
            key="command-key",
            createdAt=datetime(year=2021, month=1, day=1),
            startedAt=datetime(year=2022, month=2, day=2),
            status=CommandStatus.RUNNING,
            params=command_params,
        ),
    )

    completed_command = cast(
        Command,
        _TestCommand(
            id="command-id",
            key="command-key",
            createdAt=datetime(year=2021, month=1, day=1),
            startedAt=datetime(year=2022, month=2, day=2),
            completedAt=datetime(year=2023, month=3, day=3),
            status=CommandStatus.SUCCEEDED,
            params=command_params,
            result=command_result,
        ),
    )

    decoy.when(state_store.commands.get(command_id="command-id")).then_return(
        queued_command
    )

    decoy.when(
        queued_command._ImplementationCls(
            state_view=state_store,
            hardware_api=hardware_api,
            equipment=equipment,
            movement=movement,
            gantry_mover=mock_gantry_mover,
            labware_movement=labware_movement,
            pipetting=pipetting,
            tip_handler=mock_tip_handler,
            run_control=run_control,
            rail_lights=rail_lights,
            status_bar=status_bar,
        )
    ).then_return(
        command_impl  # type: ignore[arg-type]
    )

    decoy.when(await command_impl.execute(command_params)).then_return(command_result)

    decoy.when(model_utils.get_timestamp()).then_return(
        datetime(year=2022, month=2, day=2),
        datetime(year=2023, month=3, day=3),
    )

    await subject.execute("command-id")

    decoy.verify(
        action_dispatcher.dispatch(UpdateCommandAction(command=running_command)),
        action_dispatcher.dispatch(UpdateCommandAction(command=completed_command)),
    )


@pytest.mark.parametrize(
    ["command_error", "expected_error", "unexpected_error"],
    [
        (
            errors.ProtocolEngineError(message="oh no"),
            matchers.ErrorMatching(errors.ProtocolEngineError, match="oh no"),
            False,
        ),
        (
            EStopActivatedError("oh no"),
            matchers.ErrorMatching(PE_EStopActivatedError, match="oh no"),
            True,
        ),
        (
            RuntimeError("oh no"),
            matchers.ErrorMatching(PythonException, match="oh no"),
            True,
        ),
        (
            asyncio.CancelledError(),
            matchers.ErrorMatching(errors.RunStoppedError),
            False,
        ),
    ],
)
async def test_execute_raises_protocol_engine_error(
    decoy: Decoy,
    hardware_api: HardwareControlAPI,
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
    equipment: EquipmentHandler,
    movement: MovementHandler,
    mock_gantry_mover: GantryMover,
    labware_movement: LabwareMovementHandler,
    pipetting: PipettingHandler,
    mock_tip_handler: TipHandler,
    run_control: RunControlHandler,
    rail_lights: RailLightsHandler,
    status_bar: StatusBarHandler,
    model_utils: ModelUtils,
    subject: CommandExecutor,
    command_error: Exception,
    expected_error: Any,
    unexpected_error: bool,
) -> None:
    """It should handle an error occuring during execution."""
    TestCommandImplCls = decoy.mock(func=_TestCommandImpl)
    command_impl = decoy.mock(cls=_TestCommandImpl)

    class _TestCommand(BaseCommand[_TestCommandParams, _TestCommandResult]):
        commandType: str = "testCommand"
        params: _TestCommandParams
        result: Optional[_TestCommandResult]

        @property
        def _ImplementationCls(self) -> Type[_TestCommandImpl]:
            return TestCommandImplCls

    command_params = _TestCommandParams()

    queued_command = cast(
        Command,
        _TestCommand(
            id="command-id",
            key="command-key",
            createdAt=datetime(year=2021, month=1, day=1),
            status=CommandStatus.QUEUED,
            params=command_params,
        ),
    )

    running_command = cast(
        Command,
        _TestCommand(
            id="command-id",
            key="command-key",
            createdAt=datetime(year=2021, month=1, day=1),
            startedAt=datetime(year=2022, month=2, day=2),
            status=CommandStatus.RUNNING,
            params=command_params,
        ),
    )

    decoy.when(state_store.commands.get(command_id="command-id")).then_return(
        queued_command
    )

    decoy.when(
        queued_command._ImplementationCls(
            state_view=state_store,
            hardware_api=hardware_api,
            equipment=equipment,
            movement=movement,
            gantry_mover=mock_gantry_mover,
            labware_movement=labware_movement,
            pipetting=pipetting,
            tip_handler=mock_tip_handler,
            run_control=run_control,
            rail_lights=rail_lights,
            status_bar=status_bar,
        )
    ).then_return(
        command_impl  # type: ignore[arg-type]
    )

    decoy.when(await command_impl.execute(command_params)).then_raise(command_error)

    decoy.when(model_utils.generate_id()).then_return("error-id")
    decoy.when(model_utils.get_timestamp()).then_return(
        datetime(year=2022, month=2, day=2),
        datetime(year=2023, month=3, day=3),
    )

    await subject.execute("command-id")

    decoy.verify(
        action_dispatcher.dispatch(UpdateCommandAction(command=running_command)),
        action_dispatcher.dispatch(
            FailCommandAction(
                command_id="command-id",
                error_id="error-id",
                failed_at=datetime(year=2023, month=3, day=3),
                error=expected_error,
            )
        ),
    )
