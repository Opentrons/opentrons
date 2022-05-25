import asyncio

from tests.integration.http_api.live import util
from tests.integration.http_api.live.base_cli import BaseCli
from tests.integration.http_api.live.robot_interactions import RobotInteractions
from tests.integration.robot_client import RobotClient

HS_SLOT = "2"


async def hs_commands(robot_ip: str, robot_port: str) -> None:
    """Run the series of commands necessary to evaluate tip height against labware on the Heater Shaker."""  # noqa: E501
    async with RobotClient.make(
        host=f"http://{robot_ip}", port=robot_port, version="*"
    ) as robot_client:
        await robot_client.wait_until_alive()
        robot_interactions: RobotInteractions = RobotInteractions(
            robot_client=robot_client
        )
        hs_id = await robot_interactions.get_module_id(
            module_model="heaterShakerModuleV1"
        )
        run = await robot_client.post_run(req_body={"data": {}})
        await util.log_response(run)
        run_id = run.json()["data"]["id"]
        load_module_command = {
            "data": {
                "commandType": "loadModule",
                "params": {
                    "model": "heaterShakerModuleV1",
                    "location": {"slotName": HS_SLOT},
                    "moduleId": hs_id,
                },
            }
        }
        await robot_interactions.execute_command(
            run_id=run_id, req_body=load_module_command
        )

        close_latch_command = {
            "data": {
                "commandType": "heaterShakerModule/closeLatch",
                "params": {
                    "moduleId": hs_id,
                },
            }
        }
        await robot_interactions.execute_command(
            run_id=run_id, req_body=close_latch_command
        )

        open_latch_command = {
            "data": {
                "commandType": "heaterShakerModule/openLatch",
                "params": {
                    "moduleId": hs_id,
                },
            }
        }
        await robot_interactions.execute_command(
            run_id=run_id, req_body=open_latch_command
        )


if __name__ == "__main__":

    cli = BaseCli()
    cli.parser.description = f"""
Check HS Commands Live
1. Have a heater shaker connected via USB and powered on.
2. The code puts the HS is slot {HS_SLOT} but a pipette is not interacting with it.
3. from the robot-server directory
4. pipenv run python tests/integration/http_api/live/hs_commands.py --robot_ip ROBOT_IP
5. look at robot-server/responses.log
6. look at the logs on the robot
"""

    args = cli.parser.parse_args()
    asyncio.run(hs_commands(robot_ip=args.robot_ip, robot_port=args.robot_port))
