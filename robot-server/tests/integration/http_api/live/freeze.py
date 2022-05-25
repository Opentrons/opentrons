import asyncio
from anyio import create_task_group

from tests.integration.http_api.live.robot_interactions import RobotInteractions
from tests.integration.http_api.live.util import log_response
from tests.integration.http_api.live.base_cli import BaseCli
from tests.integration.robot_client import RobotClient

LABWARE = "nest_96_wellplate_100ul_pcr_full_skirt"
LABWARE_SLOT = "2"
LABWARE_DESTINATION_WELLS = ["A1", "A12", "H1", "H12", "D6"]
PIPETTE = "p20_single_gen2"
PIPETTE_MOUNT = "right"


async def freeze(robot_ip: str, robot_port: str) -> None:
    """Run the series of commands to repetitively move a pipette to various wells
    on a plate. This exposed a freezing issue."""
    async with RobotClient.make(
        host=f"http://{robot_ip}", port=robot_port, version="*"
    ) as robot_client:
        await robot_client.wait_until_alive()
        robot_interactions: RobotInteractions = RobotInteractions(
            robot_client=robot_client
        )
        for _ in range(3):
            run = await robot_client.post_run(req_body={"data": {}})
            await log_response(run)
            run_id = run.json()["data"]["id"]

            load_plate_command = {
                "data": {
                    "commandType": "loadLabware",
                    "params": {
                        "location": {"slotName": LABWARE_SLOT},
                        "loadName": LABWARE,
                        "namespace": "opentrons",
                        "version": 1,
                        "labwareId": "destination",
                    },
                }
            }
            await robot_interactions.execute_command(
                run_id=run_id, req_body=load_plate_command
            )

            load_pipette_command = {
                "data": {
                    "commandType": "loadPipette",
                    "params": {
                        "pipetteName": PIPETTE,
                        "mount": PIPETTE_MOUNT,
                        "pipetteId": "pipette",
                    },
                }
            }
            await robot_interactions.execute_command(
                run_id=run_id, req_body=load_pipette_command
            )

            for well in LABWARE_DESTINATION_WELLS:
                move_to_well_command = {
                    "data": {
                        "commandType": "moveToWell",
                        "params": {
                            "pipetteId": "pipette",
                            "labwareId": "destination",
                            "wellName": well,
                        },
                    }
                }
                async with create_task_group() as tg:
                    # I am not sure if this is doing what I want.
                    # I want synchronous traffic alongside the execute command call.
                    tg.start_soon(robot_client.get_run, run_id)
                    tg.start_soon(robot_interactions.query_random_runs)
                    tg.start_soon(
                        robot_interactions.execute_command, run_id, move_to_well_command
                    )

        home_command = {
            "data": {
                "commandType": "home",
                "params": {},
            }
        }
        print("Homing.")
        await robot_interactions.execute_command(run_id=run_id, req_body=home_command)


if __name__ == "__main__":

    cli = BaseCli()
    cli.parser.description = f"""
1. Attach {PIPETTE} pipette on the {PIPETTE_MOUNT}.
2. Have an empty deck.
3. Or place {LABWARE} in slot {LABWARE_SLOT}.
5. Run this without -h
"""
    args = cli.parser.parse_args()
    asyncio.run(freeze(robot_ip=args.robot_ip, robot_port=args.robot_port))
