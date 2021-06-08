# """Tests for the ProtocolEngine class."""
# from datetime import datetime, timezone
# from decoy import matchers
# from math import isclose
# from mock import AsyncMock, MagicMock  # type: ignore[attr-defined]
# from typing import cast

# from opentrons.calibration_storage.helpers import uri_from_details
# from opentrons_shared_data.deck.dev_types import DeckDefinitionV2
# from opentrons.protocols.models import LabwareDefinition
# from opentrons.types import DeckSlotName
# from opentrons.protocols.geometry.deck import FIXED_TRASH_ID

# from opentrons.protocol_engine import ProtocolEngine, errors
# from opentrons.protocol_engine.types import DeckSlotLocation
# from opentrons.protocol_engine.commands import (
#     MoveToWellRequest,
#     MoveToWellResult,
#     PendingCommand,
#     RunningCommand,
#     CompletedCommand,
#     FailedCommand,
# )
# from opentrons.protocol_engine.execution import CommandHandlers
# from opentrons.protocol_engine.state import LabwareData
# from opentrons.protocol_engine.commands.move_to_well import MoveToWellImplementation


# class CloseToNow:
#     """Matcher for any datetime that is close to now."""

#     def __init__(self) -> None:
#         """Initialize a CloseToNow matcher."""
#         self._now = datetime.now(tz=timezone.utc)

#     def __eq__(self, other: object) -> bool:
#         """Check if a target object is a datetime that is close to now."""
#         return isinstance(other, datetime) and isclose(
#             self._now.timestamp(), other.timestamp(), rel_tol=5
#         )

#     def __repr__(self) -> str:
#         """Represent the matcher as a string."""
#         return f"<datetime close to {self._now}>"


# async def test_create_engine_initializes_state_with_deck_geometry(
#     mock_hardware: MagicMock,
#     standard_deck_def: DeckDefinitionV2,
#     fixed_trash_def: LabwareDefinition,
# ) -> None:
#     """It should load deck geometry data into the store on create."""
#     engine = await ProtocolEngine.create(hardware=mock_hardware)
#     state = engine.state_view

#     assert state.labware.get_deck_definition() == standard_deck_def
#     assert state.labware.get_labware_data_by_id(FIXED_TRASH_ID) == LabwareData(
#         location=DeckSlotLocation(slot=DeckSlotName.FIXED_TRASH),
#         uri=uri_from_details(
#             load_name=fixed_trash_def.parameters.loadName,
#             namespace=fixed_trash_def.namespace,
#             version=fixed_trash_def.version,
#         ),
#         calibration=(0, 0, 0),
#     )


# async def test_execute_command_creates_command(
#     engine: ProtocolEngine,
#     mock_state_store: MagicMock,
# ) -> None:
#     """It should create a command in the state store when executing."""
#     req = MoveToWellRequest(pipetteId="123", labwareId="abc", wellName="A1")

#     await engine.execute_command(req, command_id="unique-id")
#     mock_state_store.handle_command.assert_any_call(
#         RunningCommand(
#             created_at=cast(datetime, CloseToNow()),
#             started_at=cast(datetime, CloseToNow()),
#             request=req,
#         ),
#         command_id="unique-id",
#     )


# async def test_execute_command_calls_implementation_executor(
#     engine: ProtocolEngine,
# ) -> None:
#     """It should create a command in the state store when executing."""
#     mock_req = MagicMock(spec=MoveToWellRequest)
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
#     result = MoveToWellResult()
#     mock_req = MagicMock(spec=MoveToWellRequest)
#     mock_impl = AsyncMock(spec=MoveToWellImplementation)

#     mock_req.get_implementation.return_value = mock_impl
#     mock_impl.create_command.return_value = PendingCommand(
#         request=mock_req,
#         created_at=now,
#     )
#     mock_impl.execute.return_value = result

#     cmd = await engine.execute_command(mock_req, command_id="unique-id")

#     assert cmd == CompletedCommand(
#         created_at=cast(datetime, CloseToNow()),
#         started_at=cast(datetime, CloseToNow()),
#         completed_at=cast(datetime, CloseToNow()),
#         request=mock_req,
#         result=result,
#     )

#     mock_state_store.handle_command.assert_called_with(
#         cmd,
#         command_id="unique-id",
#     )


# async def test_execute_command_adds_error_to_state(
#     engine: ProtocolEngine,
#     mock_state_store: MagicMock,
#     now: datetime,
# ) -> None:
#     """It should upsert a failed command into state."""
#     error = errors.ProtocolEngineError("oh no!")
#     mock_req = MagicMock(spec=MoveToWellRequest)
#     mock_impl = AsyncMock(spec=MoveToWellImplementation)

#     mock_req.get_implementation.return_value = mock_impl
#     mock_impl.create_command.return_value = PendingCommand(
#         request=mock_req,
#         created_at=now,
#     )
#     mock_impl.execute.side_effect = error

#     cmd = await engine.execute_command(mock_req, command_id="unique-id")

#     assert cmd == FailedCommand(
#         created_at=cast(datetime, CloseToNow()),
#         started_at=cast(datetime, CloseToNow()),
#         failed_at=cast(datetime, CloseToNow()),
#         request=mock_req,
#         error=error,
#     )

#     mock_state_store.handle_command.assert_called_with(
#         cmd,
#         command_id="unique-id",
#     )


# async def test_execute_command_adds_unexpected_error_to_state(
#     engine: ProtocolEngine,
#     mock_state_store: MagicMock,
#     now: datetime,
# ) -> None:
#     """It should upsert an unexpectedly failed command into state."""
#     error = RuntimeError("oh no!")
#     mock_req = MagicMock(spec=MoveToWellRequest)
#     mock_impl = AsyncMock(spec=MoveToWellImplementation)

#     mock_req.get_implementation.return_value = mock_impl
#     mock_impl.create_command.return_value = PendingCommand(
#         request=mock_req,
#         created_at=now,
#     )
#     mock_impl.execute.side_effect = error

#     cmd = await engine.execute_command(mock_req, command_id="unique-id")

#     assert type(cmd.error) == errors.UnexpectedProtocolError # type: ignore[union-attr
#     assert cmd.error.original_error == error  # type: ignore[union-attr]

#     mock_state_store.handle_command.assert_called_with(
#         cmd,
#         command_id="unique-id",
#     )


# def test_add_command(
#     engine: ProtocolEngine,
#     mock_state_store: MagicMock,
#     mock_resources: AsyncMock,
#     now: datetime,
# ) -> None:
#     """It should add a pending command into state."""
#     mock_resources.id_generator.generate_id.return_value = "command-id"

#     mock_req = MagicMock(spec=MoveToWellRequest)
#     mock_impl = AsyncMock(spec=MoveToWellImplementation)

#     mock_req.get_implementation.return_value = mock_impl
#     mock_impl.create_command.return_value = PendingCommand(
#         request=mock_req, created_at=now
#     )

#     result = engine.add_command(mock_req)

#     assert result == PendingCommand(
#         created_at=cast(datetime, CloseToNow()),
#         request=mock_req,
#     )

#     mock_state_store.handle_command.assert_called_with(
#         result,
#         command_id="command-id",
#     )
