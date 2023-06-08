from typing import AsyncGenerator

import pytest
from pytest_lazyfixture import lazy_fixture  # type: ignore[import]

from ...robot_client import RobotClient


@pytest.fixture
async def robot_client(base_url: str) -> AsyncGenerator[RobotClient, None]:
    async with RobotClient.make(base_url=base_url, version="*") as robot_client:
        yield robot_client


@pytest.mark.parametrize(
    (
        "base_url",
        "input_slot_1",
        "input_slot_2",
        "standardized_slot_1",
        "standardized_slot_2",
    ),
    [
        (lazy_fixture("ot2_server_base_url"), "1", "2", "1", "2"),
        (lazy_fixture("ot2_server_base_url"), "D1", "D2", "1", "2"),
        pytest.param(
            lazy_fixture("ot3_server_base_url"),
            "1",
            "2",
            "D1",
            "D2",
            marks=pytest.mark.ot3_only,
        ),
        pytest.param(
            lazy_fixture("ot3_server_base_url"),
            "D1",
            "D2",
            "D1",
            "D2",
            marks=pytest.mark.ot3_only,
        ),
    ],
)
async def test_deck_slot_standardization(
    robot_client: RobotClient,
    input_slot_1: str,
    input_slot_2: str,
    standardized_slot_1: str,
    standardized_slot_2: str,
) -> None:
    """Make sure the server standardizes deck slots given over HTTP, according to its robot type.

    For example, if you send a command mentioning slot "5" to an OT-3, it should automatically get
    standardized to "C2".

    We need to write this in Python instead of Tavern because we're parametrizing over different
    server types, and Tavern doesn't support parametrized fixtures.
    """
    module_model = "temperatureModuleV2"

    labware_load_name = "armadillo_96_wellplate_200ul_pcr_full_skirt"
    labware_namespace = "opentrons"
    labware_version = 1
    labware_uri = f"{labware_namespace}/{labware_load_name}/{labware_version}"

    # Create a run with labware offset #1, and make sure the server standardizes
    # that labware offset's deck slot.
    labware_offset_1_request = {
        "definitionUri": labware_uri,
        "location": {
            "slotName": input_slot_1,
            "moduleModel": module_model,
        },
        "vector": {"x": 1, "y": 2, "z": 3},
    }
    post_run_result = (
        await robot_client.post_run(
            req_body={"data": {"labwareOffsets": [labware_offset_1_request]}}
        )
    ).json()
    run_id = post_run_result["data"]["id"]
    [labware_offset_1_result] = post_run_result["data"]["labwareOffsets"]
    assert labware_offset_1_result["location"]["slotName"] == standardized_slot_1

    # Add labware offset #2 to the existing run, and make sure the server standardizes
    # that labware offset's deck slot.
    labware_offset_2_request = {
        "definitionUri": labware_uri,
        "location": {"slotName": input_slot_2},
        "vector": {"x": 4, "y": 5, "z": 6},
    }
    labware_offset_2_result = (
        await robot_client.post_labware_offset(
            run_id=run_id, req_body={"data": labware_offset_2_request}
        )
    ).json()["data"]
    assert labware_offset_2_result["location"]["slotName"] == standardized_slot_2

    # Load a module and make sure the server normalizes the deck slot in its params.
    load_module_result = (
        await robot_client.post_run_command(
            run_id=run_id,
            req_body={
                "data": {
                    "commandType": "loadModule",
                    "params": {
                        "model": module_model,
                        "location": {"slotName": input_slot_1},
                    },
                }
            },
            params={"waitUntilComplete": "true"},
        )
    ).json()
    assert (
        load_module_result["data"]["params"]["location"]["slotName"]
        == standardized_slot_1
    )

    # Load labware #1 on the module, and make sure it picks up labware offset #1.
    load_labware_1_result = (
        await robot_client.post_run_command(
            run_id=run_id,
            req_body={
                "data": {
                    "commandType": "loadLabware",
                    "params": {
                        "namespace": labware_namespace,
                        "loadName": labware_load_name,
                        "version": labware_version,
                        "location": {
                            "moduleId": load_module_result["data"]["result"]["moduleId"]
                        },
                    },
                }
            },
            params={"waitUntilComplete": "true"},
        )
    ).json()
    assert (
        load_labware_1_result["data"]["result"]["offsetId"]
        == labware_offset_1_result["id"]
    )

    # Load labware #2 on the deck, make sure its deck slot gets standardized,
    # and make sure it picks up labware offset #2.
    load_labware_2_result = (
        await robot_client.post_run_command(
            run_id=run_id,
            req_body={
                "data": {
                    "commandType": "loadLabware",
                    "params": {
                        "namespace": labware_namespace,
                        "loadName": labware_load_name,
                        "version": labware_version,
                        "location": {"slotName": input_slot_2},
                    },
                }
            },
            params={"waitUntilComplete": "true"},
        )
    ).json()
    assert (
        load_labware_2_result["data"]["params"]["location"]["slotName"]
        == standardized_slot_2
    )
    assert (
        load_labware_2_result["data"]["result"]["offsetId"]
        == labware_offset_2_result["id"]
    )

    # Make sure the modules and labware in the run summary show the standardized deck slots.
    run_summary = (await robot_client.get_run(run_id)).json()["data"]
    [run_summary_module] = run_summary["modules"]
    [
        run_summary_fixed_trash_labware,
        run_summary_labware_1,
        run_summary_labware_2,
    ] = run_summary["labware"]
    assert run_summary_module["location"]["slotName"] == standardized_slot_1
    assert run_summary_labware_2["location"]["slotName"] == standardized_slot_2
