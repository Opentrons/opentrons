import asyncio

from tests.integration.http_api.live import util
from tests.integration.http_api.live.base_cli import BaseCli
from tests.integration.robot_client import RobotClient


async def freeze(robot_ip: str) -> None:
    """Run the series of commands to move a pipette to various wells
    on a plate repetitively. This exposed a freezing issue"""
    async with RobotClient.make(
        host=f"http://{robot_ip}", port=31950, version="*"
    ) as robot_client:
        await robot_client.wait_until_alive()
        for _ in range(3):
            run = await robot_client.post_run(req_body={"data": {}})
            await util.log_response(run)
            run_id = run.json()["data"]["id"]

            load_plate_command = {
                "data": {
                    "commandType": "loadLabware",
                    "params": {
                        "location": {"slotName": "2"},
                        "loadName": "nest_96_wellplate_100ul_pcr_full_skirt",
                        "namespace": "opentrons",
                        "version": 1,
                        "labwareId": "destination",
                    },
                }
            }
            await util.execute_command(
                robot_client=robot_client, run_id=run_id, req_body=load_plate_command
            )

            load_pipette_command = {
                "data": {
                    "commandType": "loadPipette",
                    "params": {
                        "pipetteName": "p20_single_gen2",
                        "mount": "right",
                        "pipetteId": "20ul_pipette",
                    },
                }
            }
            await util.execute_command(
                robot_client=robot_client, run_id=run_id, req_body=load_pipette_command
            )

            wells_on_hs = ["A1", "A12", "H1", "H12", "D6"]
            for well in wells_on_hs:
                move_to_well_command = {
                    "data": {
                        "commandType": "moveToWell",
                        "params": {
                            "pipetteId": "20ul_pipette",
                            "labwareId": "destination",
                            "wellName": well,
                        },
                    }
                }
                command_task = asyncio.create_task(
                    util.execute_command(
                        robot_client=robot_client,
                        run_id=run_id,
                        req_body=move_to_well_command,
                    )
                )
                try:
                    # this is a new run we just created and should have busted the cache
                    await robot_client.get_run(run_id=run_id)
                    # more queries of the run table for load
                    await util.query_random_runs(robot_client=robot_client)
                finally:
                    await command_task

        home_command = {
            "data": {
                "commandType": "home",
                "params": {},
            }
        }
        print("Homing.")
        await util.execute_command(
            robot_client=robot_client, run_id=run_id, req_body=home_command
        )


if __name__ == "__main__":

    cli = BaseCli()
    cli.parser.description = """
1. Attach p20_single_gen2 pipette on the right.
2. Place opentrons_96_tiprack_20ul tip rack in slot 8.
3. Place nest_96_wellplate_100ul_pcr_full_skirt in slot 2.
4. Complete Pipette offset and tip length calibrations.
5. Run this without -h
"""
    args = cli.parser.parse_args()
    asyncio.run(freeze(robot_ip=args.robot_ip))
