from pathlib import Path
import secrets
from typing import IO, Callable
import json
import pytest

from tests.integration.dev_server import DevServer
from tests.integration.robot_client import RobotClient
from tests.integration.protocol_files import get_py_protocol, get_json_protocol

from opentrons.types import DeckSlotName
from opentrons.protocol_engine import (
    types as pe_types,
)

from robot_server.service.json_api import RequestModel
from robot_server.runs.run_models import RunCreate


LABWARE_OFFSET_REQUESTS = [
    pe_types.LabwareOffsetCreate(
        definitionUri="namespace_1/load_name_1/123",
        location=pe_types.LabwareOffsetLocation(slotName=DeckSlotName.SLOT_1),
        vector=pe_types.LabwareOffsetVector(x=1, y=2, z=3),
    ),
    pe_types.LabwareOffsetCreate(
        definitionUri="namespace_2/load_name_2/123",
        location=pe_types.LabwareOffsetLocation(slotName=DeckSlotName.SLOT_2),
        vector=pe_types.LabwareOffsetVector(x=1, y=2, z=3),
    ),
]

async def test_runs_persist() -> None:
    """Test that json and python protocols are persisted through dev server restart."""
    port = "15555"
    async with RobotClient.make(
        host="http://localhost", port=port, version="*"
    ) as robot_client:
        assert (
            await robot_client.wait_until_dead()
        ), "Dev Robot is running and must not be."
        with DevServer(port=port) as server:
            server.start()
            assert (
                await robot_client.wait_until_alive()
            ), "Dev Robot never became available."
            protocol = await robot_client.post_protocol(
                [
                    Path("./tests/integration/protocols/pickup_return_protocol.py"),
                ]
            )
            runs_to_create = 20
            # for _ in range(runs_to_create):
            request_body = RequestModel(
                data=RunCreate(protocolId=protocol.json()["data"]["id"])
            )
            print("analysisSummaries id" + protocol.json()["data"]["analysisSummaries"][0]["id"])
            await robot_client.wait_for_analysis_complete(protocol_id=protocol.json()["data"]["id"], analysis_id=protocol.json()["data"]["analysisSummaries"][0]["id"], timeout_sec=5)
            # request_body = {"data": {"protocolId": protocol.json()["data"]["id"]}}
            print(request_body)
            run_response = await robot_client.post_run(req_body=request_body.dict())
            print("response " + run_response.read().decode('utf-8'))
                
            response = await robot_client.get_runs()
            uploaded_runs = response.json()["data"]
            print("uploaded_runs")
            print(uploaded_runs)
            server.stop()
            assert await robot_client.wait_until_dead(), "Dev Robot did not stop."

            server.start()
            assert (
                await robot_client.wait_until_alive()
            ), "Dev Robot never became available."

            response = await robot_client.get_runs()
            print("response")
            print(response.json())
            restarted_runs = response.json()["data"]
            print("restarted_runs")
            print(restarted_runs)
            # The number of uploaded protocols prior to restart equals the number
            # of protocols in the get protocols response after restart.
            assert restarted_runs == uploaded_runs

            server.stop()


# async def test_protocol_with_labware_upload_persistence() -> None:
#     """Upload a python protocol and 2 custom labware files.
#
#     Protocol and labware are persisted on server restart.
#     """
#     port = "15556"
#     async with RobotClient.make(
#         host="http://localhost", port=port, version="*"
#     ) as robot_client:
#         assert (
#             await robot_client.wait_until_dead()
#         ), "Dev Robot is running and must not be."
#         with DevServer(port=port) as server:
#             server.start()
#             assert (
#                 await robot_client.wait_until_alive()
#             ), "Dev Robot never became available."
#             protocol = await robot_client.post_protocol(
#                 [
#                     Path("./tests/integration/protocols/cpx_4_6_tuberack_100ul.py"),
#                     Path("./tests/integration/protocols/cpx_4_tuberack_100ul.json"),
#                     Path("./tests/integration/protocols/cpx_6_tuberack_100ul.json"),
#                 ]
#             )
#             protocol_upload_json = protocol.json()
#             protocol_id = protocol_upload_json["data"]["id"]
#             result = await robot_client.get_protocol(protocol_id)
#             protocol_detail = result.json()["data"]
#             # TODO(jm, 2022-04-27): Adjust once analyses persisted.
#             del protocol_detail["analysisSummaries"]
#             server.stop()
#             assert await robot_client.wait_until_dead(), "Dev Robot did not stop."
#             server.start()
#             assert (
#                 await robot_client.wait_until_alive()
#             ), "Dev Robot never became available."
#             result = await robot_client.get_protocol(protocol_id)
#             restarted_protocol_detail = result.json()["data"]
#             # TODO(jm, 2022-04-27): Adjust once analyses persisted.
#             del restarted_protocol_detail["analysisSummaries"]
#             protocol_detail["files"].sort(key=lambda n: n["name"])
#             restarted_protocol_detail["files"].sort(key=lambda n: n["name"])
#             assert restarted_protocol_detail == protocol_detail
#             four_tuberack = Path(
#                 f"{server.persistence_directory}/protocols/{protocol_id}/cpx_4_tuberack_100ul.json"  # noqa: E501
#             )
#             six_tuberack = Path(
#                 f"{server.persistence_directory}/protocols/{protocol_id}/cpx_6_tuberack_100ul.json"  # noqa: E501
#             )
#             assert four_tuberack.is_file()
#             assert six_tuberack.is_file()
#             server.stop()
