import time
from pathlib import Path

from tests.integration.dev_server import DevServer
from tests.integration.robot_client import RobotClient

from robot_server.service.json_api import RequestModel
from robot_server.runs.run_models import RunCreate

#
# async def test_runs_persist() -> None:
#     """Test that json and python protocols are persisted through dev server restart."""
#     port = "15555"
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
#                     Path("./tests/integration/protocols/pickup_return_protocol.py"),
#                 ]
#             )
#
#             request_body = RequestModel(
#                 data=RunCreate(protocolId=protocol.json()["data"]["id"])
#             )
#             print("analysisSummaries id" + protocol.json()["data"]["analysisSummaries"][0]["id"])
#             await robot_client.wait_for_analysis_complete(protocol_id=protocol.json()["data"]["id"], analysis_id=protocol.json()["data"]["analysisSummaries"][0]["id"], timeout_sec=5)
#             print(request_body)
#             run_response = await robot_client.post_run(req_body=request_body.dict())
#             print("response " + run_response.read().decode('utf-8'))
#
#             response = await robot_client.get_runs()
#             uploaded_runs = response.json()["data"]
#             print("uploaded_runs")
#             print(uploaded_runs)
#             # TODO (tz): fixed after get_state is implemented with persistence
#             # server.stop()
#             # assert await robot_client.wait_until_dead(), "Dev Robot did not stop."
#             # print("before start")
#             # server.start()
#             # assert (
#             #     await robot_client.wait_until_alive()
#             # ), "Dev Robot never became available."
#             #
#             # print("second get run")
#             # response = await robot_client.get_runs()
#             # print("response")
#             # print(response.json())
#             # restarted_runs = response.json()["data"]
#             # print("restarted_runs")
#             # print(restarted_runs)
#             # Make sure the run persisted after reboot
#             # assert restarted_runs == uploaded_runs