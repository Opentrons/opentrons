from dataclasses import dataclass, field
from pathlib import Path
from shutil import copytree
from tempfile import TemporaryDirectory
from typing import List

import anyio
import pytest

from tests.integration.dev_server import DevServer
from tests.integration.robot_client import RobotClient, poll_until_run_completes

from .persistence_snapshots_dir import PERSISTENCE_SNAPSHOTS_DIR

# Allow plenty of time for database migrations, which can take a while in our CI runners.
_STARTUP_TIMEOUT = 60

_RUN_TIMEOUT = 5

# Our Tavern tests have servers that stay up for the duration of the test session.
# We need to pick a different port for our servers to avoid colliding with those.
# Beware that if there is a collision, these tests' manual DevServer() constructions will currently
# *not* raise an error--the tests will try to use the preexisting session-scoped servers. :(
_PORT = "15555"


@dataclass
class Run:
    id: str
    expected_command_count: int


@dataclass
class Snapshot:
    """Model to describe a snapshot of a persistence directory."""

    version: str
    expected_protocol_count: int
    expected_runs: List[Run]
    protocols_with_no_analyses: List[str] = field(default_factory=list)

    def get_copy(self) -> Path:
        """Return a path to an isolated copy of this snapshot.

        We do this to avoid accidentally modifying the files checked into Git,
        and to avoid leakage between test sessions.
        """
        snapshot_source_dir = PERSISTENCE_SNAPSHOTS_DIR / self.version
        snapshot_copy_dir = Path(TemporaryDirectory().name) / self.version
        copytree(src=snapshot_source_dir, dst=snapshot_copy_dir)
        return snapshot_copy_dir


flex_dev_compat_snapshot = Snapshot(
    version="ot3_v0.14.0_python_validation",
    expected_protocol_count=1,
    expected_runs=[Run("305b0cca-fc78-4853-b113-40ac4c30cd8f", 1)],
)


snapshots: List[(Snapshot)] = [
    Snapshot(
        version="v6.0.1",
        expected_protocol_count=4,
        expected_runs=[
            Run("7bc1f20d-3925-4aa2-b200-82906112816f", 23),
            Run("1b00190c-013f-463d-b371-5bf49b6ad61f", 16),
            Run("8165be3f-382f-4b1f-97d7-f3c4ae613868", 65),
            Run("467761f3-7339-4b8d-9007-4482500657da", 65),
            Run("f7817fa9-bc80-45c0-afea-f7c4af30a663", 333),
        ],
    ),
    Snapshot(
        version="v6.1.0",
        expected_protocol_count=2,
        expected_runs=[
            Run("a4338d46-96af-4e23-877d-1d79227a0946", 147),
            Run("efc7374f-2e64-45ea-83fe-bd7a55f2699e", 205),
        ],
    ),
    Snapshot(
        version="v6.2.0",
        expected_protocol_count=2,
        expected_runs=[
            Run("199b991d-db3c-49ff-9b4f-905118c10685", 125),
            Run("25a66ec6-2137-4680-8a94-d53c0e2a7488", 87),
        ],
    ),
    Snapshot(
        version="v6.2.0_large",
        expected_protocol_count=17,
        expected_runs=[
            Run("eeb17dc0-1878-432a-bf3f-33e7d3023b8d", 218),
            Run("917cf0f8-8b79-47ab-a407-918c182eb6df", 125),
            Run("7b87bac2-680a-4757-a10f-8341a6dce540", 185),
            Run("0b97477c-844d-406a-87e8-0852421d7212", 0),
            Run("f31659a6-33c9-406d-beb5-da2ec19ef063", 120),
            Run("965b45f4-f296-44bf-ae20-df297d3a35af", 8),
            Run("b97b0ee8-2ba4-43cd-99aa-601b60f5b75d", 13),
            Run("7dd90a28-14b6-4e6f-86a8-41ca6e6e42ae", 11),
            Run("dc9162c2-f9f6-48aa-a923-7ba252d3eb1d", 15),
            Run("2d9b6f1b-e2fd-40a9-9219-504df2c89305", 0),
            Run("9ba966c6-bc2f-4c65-b898-59a4f2530f35", 0),
            Run("5f30a0dd-e4da-4f24-abce-7468067d883a", 0),
            Run("83f0bad0-6bb2-4ecd-bccf-f14667298168", 0),
            Run("0b97363d-0910-43a0-b5a2-b6a62ad2fa6b", 96),
            Run("35c014ec-b6ea-4665-8149-5c6340cbc5ca", 0),
            Run("d2b68ac6-5c4f-4914-bc2e-f306a976d582", 220),
        ],
        protocols_with_no_analyses=[
            "429e72e1-6ff1-4328-8a1d-c13fe3ac0c80",
            "e3515d46-3c3b-425b-8734-bd6e38d6a729",
        ],
    ),
    flex_dev_compat_snapshot,
]


@pytest.mark.parametrize(
    "snapshot",
    snapshots,
)
async def test_protocols_analyses_and_runs_available_from_older_persistence_dir(
    snapshot: Snapshot,
) -> None:
    async with RobotClient.make(
        base_url=f"http://localhost:{_PORT}", version="*"
    ) as robot_client:
        assert (
            await robot_client.wait_until_dead()
        ), "Dev Robot is running and must not be."
        with DevServer(port=_PORT, persistence_directory=snapshot.get_copy()) as server:
            server.start()
            assert await robot_client.wait_until_alive(
                _STARTUP_TIMEOUT
            ), "Dev Robot never became available."
            all_protocols = (await robot_client.get_protocols()).json()["data"]

            assert len(all_protocols) == snapshot.expected_protocol_count

            for protocol_from_all_protocols_endpoint in all_protocols:
                protocol_id = protocol_from_all_protocols_endpoint["id"]

                analyses_from_all_analyses_endpoint = (
                    await robot_client.get_analyses(protocol_id=protocol_id)
                ).json()["data"]

                analysis_ids_from_all_protocols_endpoint = [
                    a["id"]
                    for a in protocol_from_all_protocols_endpoint["analysisSummaries"]
                ]

                analysis_ids_from_all_analyses_endpoint = [
                    a["id"] for a in analyses_from_all_analyses_endpoint
                ]

                assert (
                    analysis_ids_from_all_protocols_endpoint
                    == analysis_ids_from_all_analyses_endpoint
                )

                for analysis_id in analysis_ids_from_all_protocols_endpoint:
                    # Make sure this doesn't 404.
                    await robot_client.get_analysis_as_document(
                        protocol_id=protocol_id, analysis_id=analysis_id
                    )

                number_of_analyses = len(analysis_ids_from_all_protocols_endpoint)
                if protocol_id in snapshot.protocols_with_no_analyses:
                    assert number_of_analyses == 0
                else:
                    assert number_of_analyses > 0

            all_runs = (await robot_client.get_runs()).json()
            all_run_ids = [r["id"] for r in all_runs["data"]]
            assert all_run_ids == [r.id for r in snapshot.expected_runs]

            for expected_run in snapshot.expected_runs:
                await robot_client.get_run(run_id=expected_run.id)

                all_command_summaries = (
                    await robot_client.get_run_commands(
                        run_id=expected_run.id,
                        page_length=999999,  # Big enough to include all commands.
                    )
                ).json()["data"]

                assert len(all_command_summaries) == expected_run.expected_command_count
            # Ideally, we would also fetch full commands via
            # `GET /runs/{run_id}/commands/{command_id}`.
            # We skip it for performance. Adds ~10+ seconds


# TODO(mm, 2023-08-12): We can remove this test when we remove special handling for these
# protocols. https://opentrons.atlassian.net/browse/RSS-306
async def test_rerun_flex_dev_compat() -> None:
    """Test re-running a stored protocol that has messed up requirements and metadata.

    These protocols should be impossible to upload now, but that validation was added late
    during Flex development, so robots used for testing may already have them stored.
    """
    snapshot = flex_dev_compat_snapshot
    async with RobotClient.make(
        base_url=f"http://localhost:{_PORT}", version="*"
    ) as client:
        assert (
            await client.wait_until_dead()
        ), "Dev Robot is running but it should not be."
        with DevServer(persistence_directory=snapshot.get_copy(), port=_PORT) as server:
            server.start()
            assert await client.wait_until_alive(
                _STARTUP_TIMEOUT
            ), "Dev Robot never became available."

            [protocol] = (await client.get_protocols()).json()["data"]
            new_run = (
                await client.post_run({"data": {"protocolId": protocol["id"]}})
            ).json()["data"]

            # The HTTP API generally silently ignores unrecognized fields.
            # Make sure we didn't typo protocolId when we created the run.
            assert new_run["protocolId"] == protocol["id"]

            await client.post_run_action(
                run_id=new_run["id"], req_body={"data": {"actionType": "play"}}
            )

            with anyio.fail_after(_RUN_TIMEOUT):
                final_status = (
                    await poll_until_run_completes(
                        robot_client=client, run_id=new_run["id"]
                    )
                )["data"]["status"]
            assert final_status == "succeeded"
