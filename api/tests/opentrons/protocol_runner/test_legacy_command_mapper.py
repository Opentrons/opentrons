"""Tests for the PythonAndLegacyRunner's LegacyCommandMapper."""
import inspect
from datetime import datetime
from typing import cast

import pytest
from decoy import matchers, Decoy

from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.commands.types import CommentMessage, PauseMessage, CommandMessage
from opentrons.protocol_engine import (
    DeckSlotLocation,
    ModuleLocation,
    ModuleModel,
    ModuleDefinition,
    commands as pe_commands,
    actions as pe_actions,
)
from opentrons.protocol_engine.resources import (
    ModuleDataProvider,
    pipette_data_provider,
)
from opentrons.protocol_engine.resources.pipette_data_provider import (
    LoadedStaticPipetteData,
)
from opentrons.protocol_runner.legacy_command_mapper import (
    LegacyContextCommandError,
    LegacyCommandMapper,
    LegacyCommandParams,
)
from opentrons.protocol_runner.legacy_wrappers import (
    LegacyInstrumentLoadInfo,
    LegacyLabwareLoadInfo,
    LegacyModuleLoadInfo,
    LegacyTemperatureModuleModel,
)
from opentrons_shared_data.labware.dev_types import LabwareDefinition
from opentrons_shared_data.module.dev_types import ModuleDefinitionV3
from opentrons_shared_data.pipette.dev_types import PipetteNameType
from opentrons.types import DeckSlotName, Mount, MountType


@pytest.fixture
def module_data_provider(decoy: Decoy) -> ModuleDataProvider:
    """Mock module definition fetcher."""
    return decoy.mock(cls=ModuleDataProvider)


@pytest.fixture(autouse=True)
def _use_mock_pipette_data_provider(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Mock module definition fetcher."""
    for name, func in inspect.getmembers(pipette_data_provider, inspect.isfunction):
        monkeypatch.setattr(pipette_data_provider, name, decoy.mock(func=func))


def test_map_before_command() -> None:
    """It should map a "before" message to a running command."""
    legacy_command: CommentMessage = {
        "$": "before",
        "id": "message-id",
        "name": "command.COMMENT",
        "payload": {"text": "hello world"},
        "error": None,
    }

    subject = LegacyCommandMapper()
    result = subject.map_command(legacy_command)

    assert result == [
        pe_actions.UpdateCommandAction(
            private_result=None,
            command=pe_commands.Custom.construct(
                id="command.COMMENT-0",
                key="command.COMMENT-0",
                status=pe_commands.CommandStatus.RUNNING,
                createdAt=matchers.IsA(datetime),
                startedAt=matchers.IsA(datetime),
                params=LegacyCommandParams(
                    legacyCommandType="command.COMMENT",
                    legacyCommandText="hello world",
                ),
            ),
        )
    ]


def test_map_after_command() -> None:
    """It should map an "after" message to a succeeded command."""
    legacy_command_start: CommentMessage = {
        "$": "before",
        "id": "message-id",
        "name": "command.COMMENT",
        "payload": {"text": "hello world"},
        "error": None,
    }
    legacy_command_end: CommentMessage = {
        "$": "after",
        "id": "message-id",
        "name": "command.COMMENT",
        "payload": {"text": "hello world"},
        "error": None,
    }

    subject = LegacyCommandMapper()

    _ = subject.map_command(legacy_command_start)
    result = subject.map_command(legacy_command_end)

    assert result == [
        pe_actions.UpdateCommandAction(
            private_result=None,
            command=pe_commands.Custom.construct(
                id="command.COMMENT-0",
                key="command.COMMENT-0",
                status=pe_commands.CommandStatus.SUCCEEDED,
                createdAt=matchers.IsA(datetime),
                startedAt=matchers.IsA(datetime),
                completedAt=matchers.IsA(datetime),
                params=LegacyCommandParams(
                    legacyCommandType="command.COMMENT",
                    legacyCommandText="hello world",
                ),
                result=pe_commands.CustomResult(),
            ),
        )
    ]


def test_map_after_with_error_command() -> None:
    """It should map an "after" message to a failed command."""
    legacy_command_start: CommentMessage = {
        "$": "before",
        "id": "message-id",
        "name": "command.COMMENT",
        "error": None,
        "payload": {"text": "hello world"},
    }
    legacy_command_end: CommentMessage = {
        "$": "after",
        "id": "message-id",
        "name": "command.COMMENT",
        "error": RuntimeError("oh no"),
        "payload": {"text": "hello world"},
    }
    subject = LegacyCommandMapper()

    _ = subject.map_command(legacy_command_start)
    result = subject.map_command(legacy_command_end)

    assert result == [
        pe_actions.FailCommandAction(
            command_id="command.COMMENT-0",
            error_id=matchers.IsA(str),
            failed_at=matchers.IsA(datetime),
            error=matchers.ErrorMatching(
                LegacyContextCommandError,
                match="oh no",
            ),
        )
    ]


def test_command_stack() -> None:
    """It should use messages ID and command ordering to create command IDs."""
    legacy_command_1: CommentMessage = {
        "$": "before",
        "id": "message-id-1",
        "name": "command.COMMENT",
        "payload": {"text": "hello"},
        "error": None,
    }
    legacy_command_2: CommentMessage = {
        "$": "before",
        "id": "message-id-2",
        "name": "command.COMMENT",
        "payload": {"text": "goodbye"},
        "error": None,
    }
    legacy_command_3: CommentMessage = {
        "$": "after",
        "id": "message-id-1",
        "name": "command.COMMENT",
        "payload": {"text": "hello"},
        "error": None,
    }
    legacy_command_4: CommentMessage = {
        "$": "after",
        "id": "message-id-2",
        "name": "command.COMMENT",
        "payload": {"text": "goodbye"},
        "error": RuntimeError("oh no"),
    }

    subject = LegacyCommandMapper()
    result = [
        *subject.map_command(legacy_command_1),
        *subject.map_command(legacy_command_2),
        *subject.map_command(legacy_command_3),
        *subject.map_command(legacy_command_4),
    ]

    assert result == [
        pe_actions.UpdateCommandAction(
            private_result=None,
            command=pe_commands.Custom.construct(
                id="command.COMMENT-0",
                key="command.COMMENT-0",
                status=pe_commands.CommandStatus.RUNNING,
                createdAt=matchers.IsA(datetime),
                startedAt=matchers.IsA(datetime),
                params=LegacyCommandParams(
                    legacyCommandType="command.COMMENT",
                    legacyCommandText="hello",
                ),
            ),
        ),
        pe_actions.UpdateCommandAction(
            private_result=None,
            command=pe_commands.Custom.construct(
                id="command.COMMENT-1",
                key="command.COMMENT-1",
                status=pe_commands.CommandStatus.RUNNING,
                createdAt=matchers.IsA(datetime),
                startedAt=matchers.IsA(datetime),
                params=LegacyCommandParams(
                    legacyCommandType="command.COMMENT",
                    legacyCommandText="goodbye",
                ),
            ),
        ),
        pe_actions.UpdateCommandAction(
            private_result=None,
            command=pe_commands.Custom.construct(
                id="command.COMMENT-0",
                key="command.COMMENT-0",
                status=pe_commands.CommandStatus.SUCCEEDED,
                createdAt=matchers.IsA(datetime),
                startedAt=matchers.IsA(datetime),
                completedAt=matchers.IsA(datetime),
                params=LegacyCommandParams(
                    legacyCommandType="command.COMMENT",
                    legacyCommandText="hello",
                ),
                result=pe_commands.CustomResult(),
            ),
        ),
        pe_actions.FailCommandAction(
            command_id="command.COMMENT-1",
            error_id=matchers.IsA(str),
            failed_at=matchers.IsA(datetime),
            error=matchers.ErrorMatching(LegacyContextCommandError, "oh no"),
        ),
    ]


def test_map_labware_load(minimal_labware_def: LabwareDefinition) -> None:
    """It should correctly map a labware load."""
    input = LegacyLabwareLoadInfo(
        labware_definition=minimal_labware_def,
        labware_namespace="some_namespace",
        labware_load_name="some_load_name",
        labware_version=123,
        deck_slot=DeckSlotName.SLOT_1,
        on_module=False,
        offset_id="labware-offset-id-123",
        labware_display_name="My special labware",
    )
    expected_output = pe_commands.LoadLabware.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=pe_commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=pe_commands.LoadLabwareParams.construct(
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            namespace="some_namespace",
            loadName="some_load_name",
            version=123,
            displayName="My special labware",
            labwareId=None,
        ),
        result=pe_commands.LoadLabwareResult.construct(
            labwareId=matchers.IsA(str),
            # Trusting that the exact fields within in the labware definition
            # get passed through correctly.
            definition=matchers.Anything(),
            offsetId="labware-offset-id-123",
        ),
    )
    output = LegacyCommandMapper().map_equipment_load(input)
    assert output[0] == expected_output
    assert output[1] is None


def test_map_instrument_load(decoy: Decoy) -> None:
    """It should correctly map an instrument load."""
    pipette_dict = cast(PipetteDict, {"pipette_id": "fizzbuzz"})
    input = LegacyInstrumentLoadInfo(
        instrument_load_name="p1000_single_gen2",
        mount=Mount.LEFT,
        pipette_dict=pipette_dict,
    )
    pipette_config = cast(LoadedStaticPipetteData, {"config": True})

    decoy.when(
        pipette_data_provider.get_pipette_static_config(pipette_dict)
    ).then_return(pipette_config)

    result = LegacyCommandMapper().map_equipment_load(input)
    pipette_id_captor = matchers.Captor()

    assert result[0] == pe_commands.LoadPipette.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=pe_commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=pe_commands.LoadPipetteParams.construct(
            pipetteName=PipetteNameType.P1000_SINGLE_GEN2, mount=MountType.LEFT
        ),
        result=pe_commands.LoadPipetteResult.construct(pipetteId=pipette_id_captor),
    )
    assert result[1] == pe_commands.LoadPipettePrivateResult(
        pipette_id="pipette-0",
        serial_number="fizzbuzz",
        config=pipette_config,
    )


def test_map_module_load(
    decoy: Decoy,
    minimal_module_def: ModuleDefinitionV3,
    module_data_provider: ModuleDataProvider,
) -> None:
    """It should correctly map a module load."""
    test_definition = ModuleDefinition.parse_obj(minimal_module_def)
    input = LegacyModuleLoadInfo(
        requested_model=LegacyTemperatureModuleModel.TEMPERATURE_V1,
        loaded_model=LegacyTemperatureModuleModel.TEMPERATURE_V2,
        deck_slot=DeckSlotName.SLOT_1,
        configuration="conf",
        module_serial="module-serial",
    )
    decoy.when(
        module_data_provider.get_definition(ModuleModel.TEMPERATURE_MODULE_V2)
    ).then_return(test_definition)

    expected_output = pe_commands.LoadModule.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=pe_commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=pe_commands.LoadModuleParams.construct(
            model=ModuleModel.TEMPERATURE_MODULE_V1,
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            moduleId=matchers.IsA(str),
        ),
        result=pe_commands.LoadModuleResult.construct(
            moduleId=matchers.IsA(str),
            serialNumber="module-serial",
            definition=test_definition,
            model=ModuleModel.TEMPERATURE_MODULE_V2,
        ),
    )
    output = LegacyCommandMapper(
        module_data_provider=module_data_provider
    ).map_equipment_load(input)
    assert output[0] == expected_output
    assert output[1] is None


def test_map_module_labware_load(minimal_labware_def: LabwareDefinition) -> None:
    """It should correctly map a labware load on module."""
    load_input = LegacyLabwareLoadInfo(
        labware_definition=minimal_labware_def,
        labware_namespace="some_namespace",
        labware_load_name="some_load_name",
        labware_display_name="My very special module labware",
        labware_version=123,
        deck_slot=DeckSlotName.SLOT_1,
        on_module=True,
        offset_id="labware-offset-id-123",
    )

    expected_output = pe_commands.LoadLabware.construct(
        id=matchers.IsA(str),
        key=matchers.IsA(str),
        status=pe_commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        params=pe_commands.LoadLabwareParams.construct(
            location=ModuleLocation(moduleId="module-123"),
            namespace="some_namespace",
            loadName="some_load_name",
            version=123,
            displayName="My very special module labware",
            labwareId=None,
        ),
        result=pe_commands.LoadLabwareResult.construct(
            labwareId=matchers.IsA(str),
            definition=matchers.Anything(),
            offsetId="labware-offset-id-123",
        ),
    )
    subject = LegacyCommandMapper()
    subject._module_id_by_slot = {DeckSlotName.SLOT_1: "module-123"}
    output = subject.map_equipment_load(load_input)

    assert output[0] == expected_output
    assert output[1] is None


def test_map_pause() -> None:
    """It should map an "command.PAUSE" message."""
    legacy_command_start: PauseMessage = {
        "$": "before",
        "id": "message-id",
        "name": "command.PAUSE",
        "payload": {"userMessage": "hello world", "text": "hello world"},
        "error": None,
    }
    legacy_command_end: PauseMessage = {
        "$": "after",
        "id": "message-id",
        "name": "command.PAUSE",
        "payload": {"userMessage": "hello world", "text": "hello world"},
        "error": None,
    }

    subject = LegacyCommandMapper()
    result = [
        *subject.map_command(legacy_command_start),
        *subject.map_command(legacy_command_end),
    ]

    assert result == [
        pe_actions.UpdateCommandAction(
            private_result=None,
            command=pe_commands.WaitForResume.construct(
                id="command.PAUSE-0",
                key="command.PAUSE-0",
                status=pe_commands.CommandStatus.RUNNING,
                createdAt=matchers.IsA(datetime),
                startedAt=matchers.IsA(datetime),
                params=pe_commands.WaitForResumeParams(message="hello world"),
            ),
        ),
        pe_actions.UpdateCommandAction(
            private_result=None,
            command=pe_commands.WaitForResume.construct(
                id="command.PAUSE-0",
                key="command.PAUSE-0",
                status=pe_commands.CommandStatus.SUCCEEDED,
                createdAt=matchers.IsA(datetime),
                startedAt=matchers.IsA(datetime),
                completedAt=matchers.IsA(datetime),
                params=pe_commands.WaitForResumeParams(message="hello world"),
            ),
        ),
        pe_actions.PauseAction(source=pe_actions.PauseSource.PROTOCOL),
    ]


@pytest.mark.parametrize(
    "command_type",
    [
        "command.MIX",
        "command.CONSOLIDATE",
        "command.DISTRIBUTE",
        "command.TRANSFER",
        "command.RETURN_TIP",
    ],
)
def test_filter_higher_order_commands(command_type: str) -> None:
    """It should filter out higher order commands."""
    legacy_command_start = cast(
        CommandMessage,
        {
            "$": "before",
            "id": "message-id",
            "name": command_type,
            "payload": {"text": "hello world"},
            "error": None,
        },
    )
    legacy_command_end = cast(
        CommandMessage,
        {
            "$": "after",
            "id": "message-id",
            "name": command_type,
            "payload": {"text": "hello world"},
            "error": None,
        },
    )

    subject = LegacyCommandMapper()
    result = [
        *subject.map_command(legacy_command_start),
        *subject.map_command(legacy_command_end),
    ]

    assert result == []
