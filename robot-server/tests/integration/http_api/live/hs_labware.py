import asyncio

from tests.integration.http_api.live import util
from tests.integration.http_api.live.base_cli import BaseCli
from tests.integration.robot_client import RobotClient


async def hs_measure(robot_ip: str, labware: str) -> None:
    """Run the series of commands necessary to evaluate tip height against labware on the Heater Shaker."""  # noqa: E501
    async with RobotClient.make(
        host=f"http://{robot_ip}", port=31950, version="*"
    ) as robot_client:
        await robot_client.wait_until_alive()
        hs_id = await util.get_module_id(
            robot_client=robot_client, module_model="heaterShakerModuleV1"
        )
        run = await robot_client.post_run(req_body={"data": {}})
        await util.log_response(run)
        run_id = run.json()["data"]["id"]
        load_module_command = {
            "data": {
                "commandType": "loadModule",
                "params": {
                    "model": "heaterShakerModuleV1",
                    "location": {"slotName": "2"},
                    "moduleId": hs_id,
                },
            }
        }
        await util.execute_command(
            robot_client=robot_client, run_id=run_id, req_body=load_module_command
        )

        load_labware_command = {
            "data": {
                "commandType": "loadLabware",
                "params": {
                    "location": {"moduleId": hs_id},
                    "loadName": labware,
                    "namespace": "opentrons",
                    "version": 1,
                    "labwareId": "target",
                },
            }
        }
        await util.execute_command(
            robot_client=robot_client, run_id=run_id, req_body=load_labware_command
        )

        load_tiprack_command = {
            "data": {
                "commandType": "loadLabware",
                "params": {
                    "location": {"slotName": "8"},
                    "loadName": "opentrons_96_tiprack_20ul",
                    "namespace": "opentrons",
                    "version": 1,
                    "labwareId": "20ul_tips",
                },
            }
        }
        await util.execute_command(
            robot_client=robot_client, run_id=run_id, req_body=load_tiprack_command
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

        pickup_tip_command = {
            "data": {
                "commandType": "pickUpTip",
                "params": {
                    "pipetteId": "20ul_pipette",
                    "labwareId": "20ul_tips",
                    "wellName": "A1",
                },
            }
        }
        print("Picking up tip.")
        await util.execute_command(
            robot_client=robot_client, run_id=run_id, req_body=pickup_tip_command
        )

        wells_on_hs = ["A1", "A12", "H1", "H12", "D6"]
        for well in wells_on_hs:
            move_to_well_command = {
                "data": {
                    "commandType": "moveToWell",
                    "params": {
                        "pipetteId": "20ul_pipette",
                        "labwareId": "target",
                        "wellName": well,
                    },
                }
            }
            await util.execute_command(
                robot_client=robot_client, run_id=run_id, req_body=move_to_well_command
            )
            await util.ainput(f"At well {well} press Enter to move to the next well.")

        drop_tip_command = {
            "data": {
                "commandType": "dropTip",
                "params": {
                    "pipetteId": "20ul_pipette",
                    "labwareId": "20ul_tips",
                    "wellName": "A1",
                },
            }
        }
        print("Dropping tip.")
        await util.execute_command(
            robot_client=robot_client, run_id=run_id, req_body=drop_tip_command
        )

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
Check HS Labware
1. Attach p20_single_gen2 pipette on the right.
2. Place opentrons_96_tiprack_20ul tip rack in slot 8.
3. Complete pipette offset and tip length calibrations
4. Place the Heater Shaker in slot 2
5. Place the labware to test on top of the Heater Shaker.
"""

    hs_labware = [
        "opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat",
        "opentrons_96_pcr_plate_adapter_nest_wellplate_100ul_pcr_full_skirt",
        "opentrons_96_deepwell_adapter_nest_wellplate_2ml_deep",
        "opentrons_flat_plate_adapter_corning_384_wellplate_112ul_flat",
    ]

    help = "One of \n"
    for lw in hs_labware:
        help = help + lw + "\n"
    cli.parser.add_argument("--labware_key", type=str, help=help)
    args = cli.parser.parse_args()
    asyncio.run(hs_measure(robot_ip=args.robot_ip, labware=args.labware_key))
