import asyncio
from typing import Dict, List

from tests.integration.http_api.live import util
from tests.integration.http_api.live.base_cli import BaseCli
from tests.integration.http_api.live.robot_interactions import RobotInteractions
from tests.integration.robot_client import RobotClient

# Change the value for these constants to swap out
# location/pipette/tiprack

HS_SLOT = "1"  # 1, 3, 6, 4 only
TIPRACK = "opentrons_96_tiprack_20ul"
TIPRACK_SLOT = "8"
PIPETTE = "p20_single_gen2"
PIPETTE_MOUNT = "right"


async def hs_measure(robot_ip: str, robot_port: str, labware: str) -> None:
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
        await robot_interactions.execute_command(
            run_id=run_id, req_body=load_labware_command
        )

        load_tiprack_command = {
            "data": {
                "commandType": "loadLabware",
                "params": {
                    "location": {"slotName": TIPRACK_SLOT},
                    "loadName": TIPRACK,
                    "namespace": "opentrons",
                    "version": 1,
                    "labwareId": "tips",
                },
            }
        }
        await robot_interactions.execute_command(
            run_id=run_id, req_body=load_tiprack_command
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

        pickup_tip_command = {
            "data": {
                "commandType": "pickUpTip",
                "params": {
                    "pipetteId": "pipette",
                    "labwareId": "tips",
                    "wellName": "A1",
                },
            }
        }
        print("Picking up tip.")
        await robot_interactions.execute_command(
            run_id=run_id, req_body=pickup_tip_command
        )

        mapping: Dict[str, List[str]] = {
            "opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat": [
                "A1",
                "A12",
                "H1",
                "H12",
                "D6",
            ],
            "opentrons_96_pcr_plate_adapter_nest_wellplate_100ul_pcr_full_skirt": [
                "A1",
                "A12",
                "H1",
                "H12",
                "D6",
            ],
            "opentrons_96_deepwell_adapter_nest_wellplate_2ml_deep": [
                "A1",
                "A12",
                "H1",
                "H12",
                "D6",
            ],
            "opentrons_flat_plate_adapter_corning_384_wellplate_112ul_flat": [
                "A1",
                "A24",
                "P1",
                "P24",
                "H12",
            ],
        }
        wells_on_hs = mapping[labware]
        for well in wells_on_hs:
            move_to_well_command = {
                "data": {
                    "commandType": "moveToWell",
                    "params": {
                        "pipetteId": "pipette",
                        "labwareId": "target",
                        "wellName": well,
                    },
                }
            }
            await robot_interactions.execute_command(
                run_id=run_id, req_body=move_to_well_command
            )
            await util.prompt(f"At well {well} press Enter to move to the next well.")

        drop_tip_command = {
            "data": {
                "commandType": "dropTip",
                "params": {
                    "pipetteId": "pipette",
                    "labwareId": "tips",
                    "wellName": "A1",
                },
            }
        }
        print("Dropping tip.")
        await robot_interactions.execute_command(
            run_id=run_id, req_body=drop_tip_command
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
Check HS Labware
1. Change the constants to alter location, pipette, and/or tiprack.
2. Attach {PIPETTE} pipette on the {PIPETTE_MOUNT}.
3. Place {TIPRACK} tip rack in slot {TIPRACK_SLOT}.
4. Complete pipette offset and tip length calibrations
5. Place the Heater Shaker in slot {HS_SLOT}
6. Place the labware to test on top of the Heater Shaker.
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
    asyncio.run(
        hs_measure(
            robot_ip=args.robot_ip, robot_port=args.robot_port, labware=args.labware_key
        )
    )
