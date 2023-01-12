from dataclasses import dataclass, field
from pathlib import Path
from typing import List

import pytest
from tests.integration.dev_server import DevServer
from tests.integration.robot_client import RobotClient

from .persistence_snapshots_dir import PERSISTENCE_SNAPSHOTS_DIR


@dataclass
class Snapshot:
    """Model to describe a database snapshot."""

    version: str
    expected_protocol_count: int
    expected_run_count: int
    protocols_with_no_analyses: List[str] = field(default_factory=lambda: [])
    runs_with_no_commands: List[str] = field(default_factory=lambda: [])

    @property
    def db_path(self) -> Path:
        """Path of the DB."""
        return Path(PERSISTENCE_SNAPSHOTS_DIR, self.version)


@dataclass
class Analysis:
    """Model for an analysis"""

    protocol_id: str
    analysis_id: str


snapshots: List[(Snapshot)] = [
    Snapshot(version="v6.0.1", expected_protocol_count=4, expected_run_count=5),
    Snapshot(version="v6.1.0", expected_protocol_count=2, expected_run_count=2),
    Snapshot(version="v6.2.0", expected_protocol_count=2, expected_run_count=2),
    Snapshot(
        version="v6.2.0Large",
        expected_protocol_count=17,
        expected_run_count=16,
        protocols_with_no_analyses=[
            "429e72e1-6ff1-4328-8a1d-c13fe3ac0c80",
            "e3515d46-3c3b-425b-8734-bd6e38d6a729",
        ],
        runs_with_no_commands=[
            "0b97477c-844d-406a-87e8-0852421d7212",
            "2d9b6f1b-e2fd-40a9-9219-504df2c89305",
            "9ba966c6-bc2f-4c65-b898-59a4f2530f35",
            "5f30a0dd-e4da-4f24-abce-7468067d883a",
            "83f0bad0-6bb2-4ecd-bccf-f14667298168",
            "35c014ec-b6ea-4665-8149-5c6340cbc5ca",
        ],
    ),
]


@pytest.mark.parametrize(  # noqa: C901
    "snapshot",
    snapshots,
)
async def test_protocols_analyses_and_runs_available_from_older_persistence_dir(
    snapshot: Snapshot,
) -> None:
    port = "15555"
    async with RobotClient.make(
        host="http://localhost", port=port, version="*"
    ) as robot_client:
        assert (
            await robot_client.wait_until_dead()
        ), "Dev Robot is running and must not be."
        with DevServer(port=port, persistence_directory=snapshot.db_path) as server:
            server.start()
            assert (
                await robot_client.wait_until_alive()
            ), "Dev Robot never became available."
            all_protocols = (await robot_client.get_protocols()).json()
            all_protocol_ids = [p["id"] for p in all_protocols["data"]]

            assert len(all_protocol_ids) == snapshot.expected_protocol_count

            # get analysis ids from /protocols response
            protocol_endpoint_analyses: List[Analysis] = []
            for protocol in all_protocols["data"]:
                for summary in protocol["analysisSummaries"]:
                    protocol_endpoint_analyses.append(
                        Analysis(protocol["id"], summary["id"])
                    )

            for analysis in protocol_endpoint_analyses:
                result = await robot_client.get_analysis(
                    protocol_id=analysis.protocol_id,
                    analysis_id=analysis.analysis_id,
                )
                if result.json()["data"] == []:
                    assert analysis.protocol_id in snapshot.protocols_with_no_analyses

            protocol_detail_endpoint_analyses: List[Analysis] = []
            for protocol_id in all_protocol_ids:
                protocol = (
                    await robot_client.get_protocol(protocol_id=protocol_id)
                ).json()

                analysis_ids = [s["id"] for s in protocol["data"]["analysisSummaries"]]
                for analysis_id in analysis_ids:
                    protocol_detail_endpoint_analyses.append(
                        Analysis(protocol_id, analysis_id)
                    )
                    result = await robot_client.get_analysis(
                        protocol_id=protocol_id, analysis_id=analysis_id
                    )
                    if result.json()["data"] == []:
                        assert protocol_id in snapshot.protocols_with_no_analyses

            assert set(
                (a.protocol_id, a.analysis_id) for a in protocol_endpoint_analyses
            ) == set(
                (a.protocol_id, a.analysis_id)
                for a in protocol_detail_endpoint_analyses
            )

            all_runs = (await robot_client.get_runs()).json()
            all_run_ids = [r["id"] for r in all_runs["data"]]

            assert len(all_run_ids) == snapshot.expected_run_count

            for run_id in all_run_ids:
                await robot_client.get_run(run_id=run_id)

                all_command_summaries = (
                    await robot_client.get_run_commands(
                        run_id=run_id,
                        page_length=999999,  # Big enough to include all commands.
                    )
                ).json()

                if len(all_command_summaries["data"]) == 0:
                    assert run_id in snapshot.runs_with_no_commands
                else:
                    assert len(all_command_summaries["data"]) > 0

                # Ideally, we would also fetch full commands via
                # `GET /runs/{run_id}/commands/{command_id}`.
                # We skip it for performance. On my machine, it would take ~7 seconds.
