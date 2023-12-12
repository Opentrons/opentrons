"""Tests for the AnalysisStore interface."""
import json

from datetime import datetime, timezone
from pathlib import Path
from typing import List, NamedTuple

import pytest

from sqlalchemy.engine import Engine as SQLEngine

from opentrons_shared_data.pipette.dev_types import PipetteNameType

from opentrons.types import MountType, DeckSlotName
from opentrons.protocol_engine import (
    commands as pe_commands,
    errors as pe_errors,
    types as pe_types,
)
from opentrons.protocol_reader import (
    ProtocolSource,
    JsonProtocolConfig,
)

from robot_server.protocols.analysis_models import (
    AnalysisResult,
    AnalysisStatus,
    AnalysisSummary,
    PendingAnalysis,
    CompletedAnalysis,
)
from robot_server.protocols.analysis_store import (
    AnalysisStore,
    AnalysisNotFoundError,
)
from robot_server.protocols.protocol_store import (
    ProtocolStore,
    ProtocolResource,
)


@pytest.fixture
def protocol_store(sql_engine: SQLEngine) -> ProtocolStore:
    """Return a `ProtocolStore` linked to the same database as the subject under test.

    `ProtocolStore` is tested elsewhere.
    We only need it here to prepare the database for our `AnalysisStore` tests.
    An analysis always needs a protocol to link to.
    """
    return ProtocolStore.create_empty(sql_engine=sql_engine)


@pytest.fixture
def subject(sql_engine: SQLEngine) -> AnalysisStore:
    """Return the `AnalysisStore` test subject."""
    return AnalysisStore(sql_engine=sql_engine)


def make_dummy_protocol_resource(protocol_id: str) -> ProtocolResource:
    """Return a placeholder `ProtocolResource` to insert into a `ProtocolStore`.

    Args:
        protocol_id: The ID to give to the new `ProtocolResource`.
    """
    return ProtocolResource(
        protocol_id=protocol_id,
        created_at=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
        source=ProtocolSource(
            directory=Path("/dev/null"),
            main_file=Path("/dev/null"),
            config=JsonProtocolConfig(schema_version=123),
            files=[],
            metadata={},
            robot_type="OT-2 Standard",
            content_hash="abc123",
        ),
        protocol_key=None,
    )


async def test_get_empty(subject: AnalysisStore, protocol_store: ProtocolStore) -> None:
    """It should return an empty list if no analysis saved."""
    protocol_store.insert(make_dummy_protocol_resource("protocol-id"))

    full_result = await subject.get_by_protocol("protocol-id")
    summaries_result = subject.get_summaries_by_protocol("protocol-id")

    assert full_result == []
    assert summaries_result == []

    with pytest.raises(AnalysisNotFoundError, match="analysis-id"):
        await subject.get("analysis-id")


async def test_add_pending(
    subject: AnalysisStore, protocol_store: ProtocolStore
) -> None:
    """It should add a pending analysis to the store."""
    protocol_store.insert(make_dummy_protocol_resource(protocol_id="protocol-id"))

    expected_analysis = PendingAnalysis(id="analysis-id")
    expected_summary = AnalysisSummary(
        id="analysis-id",
        status=AnalysisStatus.PENDING,
    )

    result = subject.add_pending(protocol_id="protocol-id", analysis_id="analysis-id")

    assert result == expected_summary

    assert await subject.get("analysis-id") == expected_analysis
    assert await subject.get_by_protocol("protocol-id") == [expected_analysis]
    assert subject.get_summaries_by_protocol("protocol-id") == [expected_summary]
    with pytest.raises(AnalysisNotFoundError, match="analysis-id"):
        # Unlike get(), get_as_document() should raise if the analysis is pending.
        await subject.get_as_document("analysis-id")


async def test_returned_in_order_added(
    subject: AnalysisStore, protocol_store: ProtocolStore
) -> None:
    """It should return analyses from least-recently-added to most-recently-added."""
    protocol_store.insert(make_dummy_protocol_resource(protocol_id="protocol-id"))

    for analysis_id in ["analysis-id-1", "analysis-id-2", "analysis-id-3"]:
        subject.add_pending(protocol_id="protocol-id", analysis_id=analysis_id)
        await subject.update(
            analysis_id=analysis_id,
            robot_type="OT-2 Standard",
            labware=[],
            modules=[],
            pipettes=[],
            commands=[],
            errors=[],
            liquids=[],
        )

    subject.add_pending(protocol_id="protocol-id", analysis_id="analysis-id-4")
    # Leave as pending, to test that we interleave completed & pending analyses
    # in the correct order.

    expected_order = [
        "analysis-id-1",
        "analysis-id-2",
        "analysis-id-3",
        "analysis-id-4",
    ]
    summaries = subject.get_summaries_by_protocol(protocol_id="protocol-id")
    full_analyses = await subject.get_by_protocol(protocol_id="protocol-id")
    assert [s.id for s in summaries] == expected_order
    assert [a.id for a in full_analyses] == expected_order


async def test_update_adds_details_and_completes_analysis(
    subject: AnalysisStore, protocol_store: ProtocolStore
) -> None:
    """It should add details to the stored analysis and mark it completed."""
    protocol_store.insert(make_dummy_protocol_resource(protocol_id="protocol-id"))

    labware = pe_types.LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="namespace/load-name/42",
        location=pe_types.DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        offsetId=None,
    )

    pipette = pe_types.LoadedPipette(
        id="pipette-id",
        pipetteName=PipetteNameType.P300_SINGLE,
        mount=MountType.LEFT,
    )

    subject.add_pending(protocol_id="protocol-id", analysis_id="analysis-id")
    await subject.update(
        analysis_id="analysis-id",
        robot_type="OT-2 Standard",
        labware=[labware],
        pipettes=[pipette],
        # TODO(mm, 2022-10-21): Give the subject some commands, errors, and liquids here
        # and assert that we can retrieve them.
        modules=[],
        commands=[],
        errors=[],
        liquids=[],
    )

    result = await subject.get("analysis-id")
    result_as_document = await subject.get_as_document("analysis-id")

    assert result == CompletedAnalysis(
        id="analysis-id",
        result=AnalysisResult.OK,
        robotType="OT-2 Standard",
        labware=[labware],
        pipettes=[pipette],
        modules=[],
        commands=[],
        errors=[],
        liquids=[],
    )
    assert await subject.get_by_protocol("protocol-id") == [result]
    assert json.loads(result_as_document) == {
        "id": "analysis-id",
        "result": "ok",
        "status": "completed",
        "robotType": "OT-2 Standard",
        "labware": [
            {
                "id": "labware-id",
                "loadName": "load-name",
                "definitionUri": "namespace/load-name/42",
                "location": {"slotName": "1"},
            }
        ],
        "pipettes": [
            {"id": "pipette-id", "pipetteName": "p300_single", "mount": "left"}
        ],
        "commands": [],
        "errors": [],
        "liquids": [],
        "modules": [],
    }


class AnalysisResultSpec(NamedTuple):
    """Spec data for analysis result tests."""

    commands: List[pe_commands.Command]
    errors: List[pe_errors.ErrorOccurrence]
    expected_result: AnalysisResult


analysis_result_specs: List[AnalysisResultSpec] = [
    AnalysisResultSpec(
        commands=[
            pe_commands.WaitForResume(
                id="pause-1",
                key="command-key",
                status=pe_commands.CommandStatus.SUCCEEDED,
                createdAt=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
                params=pe_commands.WaitForResumeParams(message="hello world"),
                result=pe_commands.WaitForResumeResult(),
            )
        ],
        errors=[],
        expected_result=AnalysisResult.OK,
    ),
    AnalysisResultSpec(
        commands=[],
        errors=[
            pe_errors.ErrorOccurrence(
                id="error-id",
                createdAt=datetime(year=2021, month=1, day=1, tzinfo=timezone.utc),
                errorType="BadError",
                detail="oh no",
            )
        ],
        expected_result=AnalysisResult.NOT_OK,
    ),
]


@pytest.mark.parametrize(AnalysisResultSpec._fields, analysis_result_specs)
async def test_update_infers_status_from_errors(
    subject: AnalysisStore,
    protocol_store: ProtocolStore,
    commands: List[pe_commands.Command],
    errors: List[pe_errors.ErrorOccurrence],
    expected_result: AnalysisResult,
) -> None:
    """It should decide the analysis result based on whether there are errors."""
    protocol_store.insert(make_dummy_protocol_resource(protocol_id="protocol-id"))
    subject.add_pending(protocol_id="protocol-id", analysis_id="analysis-id")
    await subject.update(
        analysis_id="analysis-id",
        robot_type="OT-2 Standard",
        commands=commands,
        errors=errors,
        labware=[],
        modules=[],
        pipettes=[],
        liquids=[],
    )
    analysis = (await subject.get_by_protocol("protocol-id"))[0]
    assert isinstance(analysis, CompletedAnalysis)
    assert analysis.result == expected_result
