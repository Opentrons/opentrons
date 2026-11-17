"""Tests for the /runs/.../commandAnnotations route."""

import pytest
from decoy import Decoy, matchers

from opentrons.protocol_engine.errors import (
    CommandAnnotationNotFoundError as CommandAnnotationNotFoundInEngineError,
)
from opentrons.protocol_engine.state.commands import CommandAnnotationsSlice
from opentrons.protocol_engine.types import CommandAnnotation
from server_utils.fastapi_utils.models.json_api import MultiBodyMeta

from robot_server.errors.error_responses import ApiError
from robot_server.runs.router.command_annotations_router import (
    _DEFAULT_COMMAND_ANNOTATIONS_LIST_LENGTH,
    get_command_annotation,
    get_command_annotations_list,
)
from robot_server.runs.run_data_manager import (
    RunDataManager,
)
from robot_server.runs.run_models import RunNotFoundError
from robot_server.runs.run_store import (
    CommandAnnotationNotFoundError as CommandAnnotationNotFoundInRunStoreError,
)


async def test_get_command_annotations_slice(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
) -> None:
    """It should get a slice of run annotations commands."""
    expected_annotations = CommandAnnotationsSlice(
        command_annotations=[
            CommandAnnotation(
                id="annotation-id-1",
                source="userCommand",
                name="foo",
                params={},
            ),
            CommandAnnotation(
                id="annotation-id-2",
                source="engineCommand",
                name="bar",
                params={},
            ),
        ],
        cursor=100,
        total_length=400,
    )
    decoy.when(
        await mock_run_data_manager.get_command_annotations_slice(
            run_id="run-id", cursor=1, length=4
        )
    ).then_return(expected_annotations)
    result = await get_command_annotations_list(
        runId="run-id",
        run_data_manager=mock_run_data_manager,
        cursor=1,
        pageLength=4,
    )
    assert result.content.data == expected_annotations.command_annotations
    assert result.content.meta == MultiBodyMeta(
        cursor=expected_annotations.cursor,
        totalLength=expected_annotations.total_length,
    )
    assert result.status_code == 200


async def test_get_command_annotations_list_raises_error(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
) -> None:
    """It should 404 if you attempt to get a command annotation from a non-existent run."""
    decoy.when(
        mock_run_data_manager.get_command_annotations_slice(
            run_id="run-id", cursor=1, length=4
        )
    ).then_raise(RunNotFoundError("uh oh"))
    with pytest.raises(ApiError) as exc_info:
        await get_command_annotations_list(
            runId="run-id",
            run_data_manager=mock_run_data_manager,
            cursor=1,
            pageLength=4,
        )
    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["detail"] == matchers.StringMatching(
        "uh oh"
    )


@pytest.mark.parametrize(
    argnames=["total_annotations_in_run", "expected_cursor"],
    argvalues=[
        (10, 0),
        (100, 80),
        (0, 0),
        (20, 0),
        (21, 1),
    ],
)
async def test_get_command_annotations_slice_uses_default_values(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
    total_annotations_in_run: int,
    expected_cursor: int,
) -> None:
    """It should use correct default values for cursor and page length according to the total number of annotations in the run."""
    expected_page_length = _DEFAULT_COMMAND_ANNOTATIONS_LIST_LENGTH
    sample_cmd_annotations_slice = CommandAnnotationsSlice(
        command_annotations=[],
        cursor=123,
        total_length=456,
    )
    decoy.when(
        await mock_run_data_manager.get_total_command_annotations_count("run-id")
    ).then_return(total_annotations_in_run)
    decoy.when(
        await mock_run_data_manager.get_command_annotations_slice(
            run_id="run-id",
            cursor=expected_cursor,
            length=expected_page_length,
        )
    ).then_return(sample_cmd_annotations_slice)
    result = await get_command_annotations_list(
        runId="run-id",
        run_data_manager=mock_run_data_manager,
        cursor=None,
    )
    assert result.content.data == sample_cmd_annotations_slice.command_annotations
    assert result.content.meta == MultiBodyMeta(cursor=123, totalLength=456)


@pytest.mark.parametrize(
    argnames=["page_length", "total_annotations_in_run", "expected_cursor"],
    argvalues=[(10, 14, 4), (2, 100, 98), (100, 5, 0)],
)
async def test_get_command_annotations_slice_cursor_calculation_non_default_page_length(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
    page_length: int,
    total_annotations_in_run: int,
    expected_cursor: int,
) -> None:
    """It should use correct cursor for non-default page lengths."""
    sample_cmd_annotations_slice = CommandAnnotationsSlice(
        command_annotations=[],
        cursor=123,
        total_length=456,
    )
    decoy.when(
        await mock_run_data_manager.get_total_command_annotations_count("run-id")
    ).then_return(total_annotations_in_run)
    decoy.when(
        await mock_run_data_manager.get_command_annotations_slice(
            run_id="run-id",
            cursor=expected_cursor,
            length=page_length,
        )
    ).then_return(sample_cmd_annotations_slice)
    result = await get_command_annotations_list(
        runId="run-id",
        run_data_manager=mock_run_data_manager,
        cursor=None,
        pageLength=page_length,
    )
    assert result.content.data == sample_cmd_annotations_slice.command_annotations
    assert result.content.meta == MultiBodyMeta(cursor=123, totalLength=456)


async def test_get_command_annotations_slice_with_non_default_cursor(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
) -> None:
    """It should use the provided cursor value."""
    sample_cmd_annotations_slice = CommandAnnotationsSlice(
        command_annotations=[],
        cursor=123,
        total_length=456,
    )
    decoy.when(
        await mock_run_data_manager.get_command_annotations_slice(
            run_id="run-id",
            cursor=100,
            length=4,
        )
    ).then_return(sample_cmd_annotations_slice)
    result = await get_command_annotations_list(
        runId="run-id",
        run_data_manager=mock_run_data_manager,
        cursor=100,
        pageLength=4,
    )
    assert result.content.data == sample_cmd_annotations_slice.command_annotations
    assert result.content.meta == MultiBodyMeta(cursor=123, totalLength=456)


async def test_get_specified_command_annotation(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
) -> None:
    """Should return the correct command annotation."""
    expected_annotation = CommandAnnotation(
        id="annotation-id",
        source="userCommand",
        name="foo",
        params={},
    )
    decoy.when(
        await mock_run_data_manager.get_command_annotation("run-id", "annotation-id")
    ).then_return(expected_annotation)
    result = await get_command_annotation(
        runId="run-id",
        run_data_manager=mock_run_data_manager,
        commandAnnotationId="annotation-id",
    )
    assert result.content.data == expected_annotation
    assert result.status_code == 200


@pytest.mark.parametrize(
    "exception",
    [
        RunNotFoundError("womp womp womp"),
        CommandAnnotationNotFoundInEngineError("womp womp womp"),
        CommandAnnotationNotFoundInRunStoreError("womp womp womp"),
    ],
)
async def test_get_command_annotation_raises_errors(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
    exception: Exception,
) -> None:
    """It should 404 if you attempt to get a non-existent command annotation."""
    decoy.when(
        await mock_run_data_manager.get_command_annotation("run-id", "annotation-id")
    ).then_raise(exception)

    with pytest.raises(ApiError) as exc_info:
        await get_command_annotation(
            runId="run-id",
            run_data_manager=mock_run_data_manager,
            commandAnnotationId="annotation-id",
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["detail"] == matchers.StringMatching(
        "womp womp womp"
    )
