"""Tests for the ProtocolEngine class."""
import pytest
from datetime import datetime, timezone
from decoy import Decoy, matchers
from math import isclose
from mock import MagicMock
from typing import cast

from opentrons.calibration_storage.helpers import uri_from_details
from opentrons_shared_data.deck.dev_types import DeckDefinitionV2
from opentrons.protocols.models import LabwareDefinition
from opentrons.types import DeckSlotName, MountType
from opentrons.protocols.geometry.deck import FIXED_TRASH_ID
from opentrons.hardware_control.api import API as HardwareAPI

from opentrons.protocol_engine import ProtocolEngine, commands, errors
from opentrons.protocol_engine.types import DeckSlotLocation, PipetteName
from opentrons.protocol_engine.execution import CommandExecutor
from opentrons.protocol_engine.resources import ResourceProviders
from opentrons.protocol_engine.state import StateStore, LabwareData


@pytest.fixture
def hardware(decoy: Decoy) -> HardwareAPI:
    """Get a mock HardwareAPI."""
    return decoy.create_decoy(spec=HardwareAPI)


@pytest.fixture
def state_store(decoy: Decoy) -> StateStore:
    """Get a mock StateStore."""
    return decoy.create_decoy(spec=StateStore)


@pytest.fixture
def executor(decoy: Decoy) -> CommandExecutor:
    """Get a mock CommandExecutor."""
    return decoy.create_decoy(spec=CommandExecutor)


@pytest.fixture
def resources(decoy: Decoy) -> ResourceProviders:
    """Get mock ResourceProviders."""
    return decoy.create_decoy(spec=ResourceProviders)


@pytest.fixture
def subject(
    hardware: HardwareAPI,
    state_store: StateStore,
    executor: CommandExecutor,
    resources: ResourceProviders,
) -> ProtocolEngine:
    """Get a ProtocolEngine test subject with its dependencies stubbed out."""
    return ProtocolEngine(
        hardware=hardware,
        state_store=state_store,
        executor=executor,
        resources=resources,
    )


async def test_create_engine_initializes_state_with_deck_geometry(
    mock_hardware: MagicMock,
    standard_deck_def: DeckDefinitionV2,
    fixed_trash_def: LabwareDefinition,
) -> None:
    """It should load deck geometry data into the store on create."""
    engine = await ProtocolEngine.create(hardware=mock_hardware)
    state = engine.state_view

    assert state.labware.get_deck_definition() == standard_deck_def
    assert state.labware.get_labware_data_by_id(FIXED_TRASH_ID) == LabwareData(
        location=DeckSlotLocation(slot=DeckSlotName.FIXED_TRASH),
        uri=uri_from_details(
            load_name=fixed_trash_def.parameters.loadName,
            namespace=fixed_trash_def.namespace,
            version=fixed_trash_def.version,
        ),
        calibration=(0, 0, 0),
    )


def test_add_command(
    decoy: Decoy,
    executor: CommandExecutor,
    state_store: StateStore,
    subject: ProtocolEngine,
) -> None:
    """It should add a command to the state from a request."""
    data = commands.LoadPipetteData(
        mount=MountType.LEFT,
        pipetteName=PipetteName.P300_SINGLE,
    )

    request = commands.LoadPipetteRequest(data=data)

    queued_command = commands.LoadPipette(
        id="command-id",
        status=commands.CommandStatus.QUEUED,
        createdAt=datetime(year=2021, month=1, day=1),
        data=request.data,
    )

    decoy.when(executor.create_command(request)).then_return(queued_command)

    result = subject.add_command(request)

    assert result == queued_command
    decoy.verify(state_store.handle_command(queued_command))


async def test_execute_command_by_id(
    decoy: Decoy,
    executor: CommandExecutor,
    state_store: StateStore,
    subject: ProtocolEngine,
) -> None:
    """It should execute an existing command in the state."""
    data = commands.LoadPipetteData(
        mount=MountType.LEFT,
        pipetteName=PipetteName.P300_SINGLE,
    )

    queued_command = commands.LoadPipette(
        id="command-id",
        status=commands.CommandStatus.QUEUED,
        createdAt=datetime(year=2021, month=1, day=1),
        data=data,
    )

    running_command = commands.LoadPipette(
        id="command-id",
        status=commands.CommandStatus.RUNNING,
        createdAt=datetime(year=2021, month=1, day=1),
        data=data,
    )

    executed_command = commands.LoadPipette(
        id="command-id",
        status=commands.CommandStatus.EXECUTED,
        createdAt=datetime(year=2021, month=1, day=1),
        data=data,
    )

    decoy.when(
        state_store.state_view.commands.get_command_by_id("command-id")
    ).then_return(queued_command)
    decoy.when(executor.to_running(queued_command)).then_return(running_command)
    decoy.when(await executor.execute(running_command)).then_return(executed_command)

    result = await subject.execute_command_by_id("command-id")

    assert result == executed_command
    decoy.verify(
        state_store.handle_command(running_command),
        state_store.handle_command(executed_command),
    )


async def test_execute_command(
    decoy: Decoy,
    executor: CommandExecutor,
    state_store: StateStore,
    subject: ProtocolEngine,
) -> None:
    """It should add and execute a command from a request."""
    data = commands.LoadPipetteData(
        mount=MountType.LEFT,
        pipetteName=PipetteName.P300_SINGLE,
    )

    request = commands.LoadPipetteRequest(data=data)

    queued_command = commands.LoadPipette(
        id="command-id",
        status=commands.CommandStatus.QUEUED,
        createdAt=datetime(year=2021, month=1, day=1),
        data=data,
    )

    running_command = commands.LoadPipette(
        id="command-id",
        status=commands.CommandStatus.RUNNING,
        createdAt=datetime(year=2021, month=1, day=1),
        data=data,
    )

    executed_command = commands.LoadPipette(
        id="command-id",
        status=commands.CommandStatus.EXECUTED,
        createdAt=datetime(year=2021, month=1, day=1),
        data=data,
    )

    decoy.when(executor.create_command(request)).then_return(queued_command)
    decoy.when(executor.to_running(queued_command)).then_return(running_command)
    decoy.when(await executor.execute(running_command)).then_return(executed_command)

    result = await subject.execute_command(request)

    assert result == executed_command
    decoy.verify(
        state_store.handle_command(running_command),
        state_store.handle_command(executed_command),
    )


# async def test_execute_command_creates_command(
#     engine: ProtocolEngine,
#     mock_state_store: MagicMock,
#     now: datetime,
# ) -> None:
#     """It should create a command in the state store when executing."""
#     data = commands.MoveToWellData(
#         pipetteId="123",
#         labwareId="abc",
#         wellName="A1",
#     )
#     req = commands.MoveToWellRequest(data=data)
#     command = commands.MoveToWell.construct(
#         id="unique-id",
#         createdAt=now,
#         startedAt=now,
#         status=commands.CommandStatus.RUNNING,
#         data=data,
#     )

#     # TODO(mc, 2021-06-21): this is serious code smell, refactor
#     req.create_command = MagicMock()
#     req.create_command.return_value = command

#     await engine.execute_command(req, command_id="unique-id")

#     req.create_command.assert_called_with(
#         command
#     )

#     mock_state_store.handle_command.assert_any_call(
#         commands.MoveToWell.construct(
#             id="unique-id",
#             createdAt=cast(datetime, CloseToNow()),
#             startedAt=cast(datetime, CloseToNow()),
#             status=commands.CommandStatus.RUNNING,
#             data=data,
#         )
#     )


# async def test_execute_command_calls_implementation_executor(
#     engine: ProtocolEngine,
# ) -> None:
#     """It should create a command in the state store when executing."""
#     mock_req = MagicMock(spec=commands.MoveToWellRequest)
#     mock_impl = AsyncMock(spec=MoveToWellImplementation)

#     mock_req.get_implementation.return_value = mock_impl

#     await engine.execute_command(mock_req, command_id="unique-id")

#     mock_impl.execute.assert_called_with(matchers.IsA(CommandHandlers))


# async def test_execute_command_adds_result_to_state(
#     engine: ProtocolEngine,
#     mock_state_store: MagicMock,
#     now: datetime,
# ) -> None:
#     """It should upsert the completed command into state."""
#     data = commands.MoveToWellData(
#         pipetteId="123",
#         labwareId="abc",
#         wellName="A1",
#     )
#     result = commands.MoveToWellResult()

#     mock_req = MagicMock(spec=commands.MoveToWellRequest)
#     mock_impl = AsyncMock(spec=MoveToWellImplementation)

#     mock_req.get_implementation.return_value = mock_impl
#     mock_impl.create_command.return_value = commands.MoveToWell(
#         id="unique-id",
#         createdAt=now,
#         status=commands.CommandStatus.RUNNING,
#         data=data,
#     )
#     mock_impl.execute.return_value = result

#     cmd = await engine.execute_command(mock_req, command_id="unique-id")

#     assert cmd == commands.MoveToWell.construct(
#         id="unique-id",
#         status=commands.CommandStatus.EXECUTED,
#         createdAt=now,
#         startedAt=cast(datetime, CloseToNow()),
#         completedAt=cast(datetime, CloseToNow()),
#         data=data,
#         result=result,
#     )

#     mock_state_store.handle_command.assert_called_with(cmd)


# async def test_execute_command_adds_error_to_state(
#     engine: ProtocolEngine,
#     mock_state_store: MagicMock,
#     now: datetime,
# ) -> None:
#     """It should upsert a failed command into state."""
#     data = commands.MoveToWellData(
#         pipetteId="123",
#         labwareId="abc",
#         wellName="A1",
#     )
#     error = errors.ProtocolEngineError("oh no!")
#     mock_req = MagicMock(spec=commands.MoveToWellRequest)
#     mock_impl = AsyncMock(spec=MoveToWellImplementation)

#     mock_req.get_implementation.return_value = mock_impl
#     mock_impl.create_command.return_value = commands.MoveToWell(
#         id="unique-id",
#         createdAt=now,
#         status=commands.CommandStatus.RUNNING,
#         data=data,
#     )
#     mock_impl.execute.side_effect = error

#     cmd = await engine.execute_command(mock_req, command_id="unique-id")

#     assert cmd == commands.MoveToWell.construct(
#         id="unique-id",
#         status=commands.CommandStatus.FAILED,
#         createdAt=now,
#         startedAt=cast(datetime, CloseToNow()),
#         completedAt=cast(datetime, CloseToNow()),
#         data=data,
#         error="oh no!",
#     )

#     mock_state_store.handle_command.assert_called_with(cmd)


# def test_add_command(
#     engine: ProtocolEngine,
#     mock_state_store: MagicMock,
#     mock_resources: AsyncMock,
#     now: datetime,
# ) -> None:
#     """It should add a pending command into state."""
#     data = commands.MoveToWellData(
#         pipetteId="123",
#         labwareId="abc",
#         wellName="A1",
#     )
#     mock_resources.id_generator.generate_id.return_value = "command-id"

#     mock_req = MagicMock(spec=commands.MoveToWellRequest)
#     mock_impl = AsyncMock(spec=MoveToWellImplementation)

#     mock_req.get_implementation.return_value = mock_impl
#     mock_impl.create_command.return_value = commands.MoveToWell(
#         id="unique-id",
#         createdAt=now,
#         status=commands.CommandStatus.QUEUED,
#         data=data,
#     )
#     result = engine.add_command(mock_req)

#     assert result == commands.MoveToWell.construct(
#         id="unique-id",
#         status=commands.CommandStatus.QUEUED,
#         createdAt=now,
#         data=data,
#     )

#     mock_state_store.handle_command.assert_called_with(result)
