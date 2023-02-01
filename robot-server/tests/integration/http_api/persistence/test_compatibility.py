from dataclasses import dataclass
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

    @property
    def db_path(self) -> Path:
        """Path of the DB."""
        return Path(PERSISTENCE_SNAPSHOTS_DIR, self.version)


snapshots: List[(Snapshot)] = [
    Snapshot(version="v6.0.1", expected_protocol_count=4, expected_run_count=5),
    Snapshot(version="v6.1.0", expected_protocol_count=2, expected_run_count=2),
    Snapshot(version="v6.2.0", expected_protocol_count=2, expected_run_count=2),
]


@pytest.mark.parametrize(
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

            for protocol_id in all_protocol_ids:
                protocol = (
                    await robot_client.get_protocol(protocol_id=protocol_id)
                ).json()

                analysis_ids = [s["id"] for s in protocol["data"]["analysisSummaries"]]
                assert len(analysis_ids) >= 1
                for analysis_id in analysis_ids:
                    await robot_client.get_analysis(
                        protocol_id=protocol_id, analysis_id=analysis_id
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
                assert len(all_command_summaries["data"]) > 0

                # Ideally, we would also fetch full commands via
                # `GET /runs/{run_id}/commands/{command_id}`.
                # We skip it for performance. On my machine, it would take ~7 seconds.
