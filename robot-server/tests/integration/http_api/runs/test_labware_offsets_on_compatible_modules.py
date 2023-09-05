import asyncio
from textwrap import dedent
from typing import Any, AsyncGenerator

import anyio
import pytest

from tests.integration.robot_client import RobotClient


# An arbitrary choice of labware.
LABWARE_LOAD_NAME = "opentrons_96_aluminumblock_biorad_wellplate_200ul"
LABWARE_URI = "opentrons/opentrons_96_aluminumblock_biorad_wellplate_200ul/1"
SLOT = "1"

RUN_POLL_INTERVAL = 0.01
RUN_POLL_TIMEOUT = 10


def generate_protocol_contents(
    use_protocol_engine_backend: bool,
    python_api_module_load_name: str,
) -> bytes:
    api_level = "2.14" if use_protocol_engine_backend else "2.13"
    return dedent(
        f"""\
        metadata = {{"apiLevel": "{api_level}"}}
        def run(context):
            module = context.load_module("{python_api_module_load_name}", {SLOT})
            labware = module.load_labware("{LABWARE_LOAD_NAME}")
        """
    ).encode("utf-8")


async def poll_until_run_succeeds(robot_client: RobotClient, run_id: str) -> Any:
    """Wait until a run completes, and then assert that it succeeded.

    Return the completed run response.
    """
    completed_run_statuses = {"stopped", "failed", "succeeded"}
    while True:
        run = (await robot_client.get_run(run_id=run_id)).json()
        status = run["data"]["status"]
        if status in completed_run_statuses:
            assert status == "succeeded"
            return run
        else:
            # The run is still ongoing. Wait a beat, then poll again.
            await asyncio.sleep(RUN_POLL_INTERVAL)


@pytest.fixture
async def robot_client(
    ot2_server_base_url: str,
) -> AsyncGenerator[RobotClient, None]:
    """Return a client for a running dev server."""
    async with RobotClient.make(
        base_url=ot2_server_base_url, version="*"
    ) as robot_client:
        assert (
            await robot_client.wait_until_alive()
        ), "Dev Robot never became available."
        yield robot_client


@pytest.mark.parametrize("use_protocol_engine_backend", [False, True])
@pytest.mark.parametrize(
    (
        "python_api_module_load_name",
        "labware_offset_module_model",
        "labware_offset_should_apply",
    ),
    [
        # The model in the labware offset matches what the protocol requests.
        # The server should apply the labware offset.
        ("temperature module", "temperatureModuleV1", True),
        ("temperature module gen2", "temperatureModuleV2", True),
        # The model in the labware offset does not match what the protocol requests.
        # The server should not apply the labware offset.
        ("temperature module", "temperatureModuleV2", False),
        ("temperature module gen2", "temperatureModuleV1", False),
    ],
)
async def test_labware_offsets_on_compatible_modules(
    robot_client: RobotClient,
    use_protocol_engine_backend: bool,
    python_api_module_load_name: str,
    labware_offset_module_model: str,
    labware_offset_should_apply: bool,
) -> None:
    """Test that the server correctly handles "compatible" modules when applying
    labware offsets.

    When a protocol loads a hardware module, it specifies the specific model that it's
    requesting. However, at runtime, the model that the robot actually loads can be
    slightly different, as long as it's still "compatible."

    For example, a protocol can request a Temperature Module GEN2, but actually receive
    a Temperature Module GEN1 at run time, if that's what's plugged in.

    This causes confusion when an HTTP client wants to apply labware offsets to a run.
    When the client wants to apply an offset to a labware atop a module, it needs to
    specify the module's model. But should it use the model that the protocol requests,
    or the model that's actually plugged in to the robot?

    The HTTP API documents that the client should use the model that the protocol
    requests. This test makes sure that the server upholds its end of that contract.

    Bug reference: RSS-194
    """
    # Create a protocol run.
    protocol_contents = generate_protocol_contents(
        use_protocol_engine_backend=use_protocol_engine_backend,
        python_api_module_load_name=python_api_module_load_name,
    )
    protocol = (
        await robot_client.post_protocol(files=[("protocol.py", protocol_contents)])
    ).json()
    protocol_id = protocol["data"]["id"]
    run = (
        await robot_client.post_run(req_body={"data": {"protocolId": protocol_id}})
    ).json()
    run_id = run["data"]["id"]

    # Apply a labware offset to the run.
    labware_offset = (
        await robot_client.post_labware_offset(
            run_id=run_id,
            req_body={
                "data": {
                    "definitionUri": LABWARE_URI,
                    "location": {
                        "slotName": SLOT,
                        "moduleModel": labware_offset_module_model,
                    },
                    "vector": {"x": 11.1, "y": 22.2, "z": 33.3},
                }
            },
        )
    ).json()
    labware_offset_id = labware_offset["data"]["id"]

    # Play the run and wait for it to succeed.
    await robot_client.post_run_action(
        run_id=run_id, req_body={"data": {"actionType": "play"}}
    )
    with anyio.fail_after(RUN_POLL_TIMEOUT):
        await poll_until_run_succeeds(robot_client=robot_client, run_id=run_id)

    # Retrieve details about the protocol's completed commands.
    commands = (await robot_client.get_run_commands(run_id=run_id)).json()
    [_, load_module_command_summary, load_labware_command_summary] = commands["data"]
    assert load_module_command_summary["commandType"] == "loadModule"
    load_module_command = (
        await robot_client.get_run_command(
            run_id=run_id, command_id=load_module_command_summary["id"]
        )
    ).json()
    load_module_result = load_module_command["data"]["result"]
    assert load_labware_command_summary["commandType"] == "loadLabware"
    load_labware_command = (
        await robot_client.get_run_command(
            run_id=run_id, command_id=load_labware_command_summary["id"]
        )
    ).json()
    load_labware_result = load_labware_command["data"]["result"]

    # Make sure the labware offset applied, or didn't apply, as we expect.
    if labware_offset_should_apply:
        assert load_labware_result["offsetId"] == labware_offset_id
    else:
        assert load_labware_result.get("offsetId", None) is None

    # For this test to catch bugs like RSS-194, there must be at least some cases where
    # the module model that the protocol requests is different from the one that
    # the server actually finds.
    #
    # This is currently true because:
    #   1. This test's parametrizations vary the module that the protocol requests
    #      between temperatureModuleV1 and temperatureModuleV2.
    #   2. The dev server always has a single model of Temperature Module connected,
    #      as a constant.
    #
    # Make sure that (2) stays true so this test doesn't become useless.
    assert load_module_result["model"] == "temperatureModuleV1"
