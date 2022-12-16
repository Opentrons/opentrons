from pathlib import Path
from typing import List

import pytest
from pydantic import BaseModel, Field
from tests.integration.dev_server import DevServer
from tests.integration.robot_client import RobotClient

from .persistence_snapshots_dir import PERSISTENCE_SNAPSHOTS_DIR


class Snapshot(BaseModel):
    """Model to describe a database snapshot."""

    version: str = Field(description="Name of the directory (version) to test.")
    expected_protocol_count: int = Field(
        description="How many protocols are in the db snapshot."
    )
    expected_run_count: int = Field(description="How many runs are in the db snapshot.")

    @property
    def db_path(self) -> Path:
        """Path of the DB."""
        # FIXME(mm, 2022-09-09): This assumes the current working directory is
        # the root project directory. See Jira RSS-104.
        return Path(f"tests/integration/persistence_snapshots/{self.version}")


class Snapshots:
    v601: Snapshot = Snapshot(
        version="v6.0.1", expected_protocol_count=4, expected_run_count=5
    )
    v620: Snapshot = Snapshot(
        version="v6.2.0", expected_protocol_count=2, expected_run_count=2
    )

    def to_test(self) -> List[(Snapshot)]:
        """The List of snapshots to test."""
        return [(self.v601), (self.v620)]


@pytest.mark.parametrize(
    "snapshot",
    Snapshots().to_test(),
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
