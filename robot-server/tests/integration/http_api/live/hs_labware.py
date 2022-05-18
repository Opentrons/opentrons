import argparse
import asyncio
import json
import sys
from typing import Any, Dict

from httpx import Response
from tests.integration.robot_client import RobotClient

DEBUG = False


async def ainput(string: str) -> str:
    await asyncio.get_event_loop().run_in_executor(None, lambda s=string: print(s))
    return await asyncio.get_event_loop().run_in_executor(None, sys.stdin.readline)


async def print_response(response: Response) -> None:
    """Log/print the response status, url, and json response."""
    endpoint = f"\nstatus_code = {response.status_code}\n{response.url}\n"
    if DEBUG:
        print(endpoint)
    formatted_response_body = json.dumps(response.json(), indent=4)
    # print(formatted_response_body) # too big to do in console usefully
    with open("responses.log", "a") as log:
        log.write(endpoint)
        log.write(formatted_response_body)


async def execute_command(
    robot_client: RobotClient, run_id: str, req_body: Dict[str, Any]
) -> None:
    """Post a command to a run waiting until complete then log/print the response."""
    params = {"waitUntilComplete": True}
    command = await robot_client.post_run_command(
        run_id=run_id,
        req_body=req_body,
        params=params,
    )
    await print_response(command)


async def measure(robot_ip: str, labware: str) -> None:
    """Run the series of commands necessary to evaluate tip height against labware on the Heater Shaker."""  # noqa: E501
    async with RobotClient.make(
        host=f"http://{robot_ip}", port=31950, version="*"
    ) as robot_client:
        await robot_client.wait_until_alive()
        modules = await robot_client.get_modules()
        await print_response(modules)
        hs_ids = [
            module["id"]
            for module in modules.json()["data"]
            if module["moduleModel"] == "heaterShakerModuleV1"
        ]
        hs_id = hs_ids[0]
        run = await robot_client.post_run(req_body={"data": {}})
        await print_response(run)
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
        await execute_command(
            robot_client=robot_client, run_id=run_id, req_body=load_module_command
        )

        labware_load_name = "opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat"
        load_labware_command = {
            "data": {
                "commandType": "loadLabware",
                "params": {
                    "location": {"moduleId": hs_id},
                    "loadName": labware_load_name,
                    "namespace": "opentrons",
                    "version": 1,
                    "labwareId": "target",
                },
            }
        }
        await execute_command(
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
        await execute_command(
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
        await execute_command(
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
        await execute_command(
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
            await execute_command(
                robot_client=robot_client, run_id=run_id, req_body=move_to_well_command
            )
            await ainput(f"At well {well} press Enter to move to the next well.")

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
        await execute_command(
            robot_client=robot_client, run_id=run_id, req_body=drop_tip_command
        )

        home_command = {
            "data": {
                "commandType": "home",
                "params": {},
            }
        }
        print("Homing.")
        await execute_command(
            robot_client=robot_client, run_id=run_id, req_body=home_command
        )


class Formatter(argparse.RawTextHelpFormatter, argparse.RawDescriptionHelpFormatter):
    pass


if __name__ == "__main__":
    hs_labware = [
        "opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat",
        "opentrons_96_pcr_plate_adapter_nest_wellplate_100ul_pcr_full_skirt",
        "opentrons_96_deepwell_adapter_nest_wellplate_2ml_deep",
        "opentrons_flat_plate_adapter_corning_384_wellplate_112ul_flat",
    ]
    parser = argparse.ArgumentParser(
        formatter_class=Formatter,
        description="Check HS Labware\n1. Attach p20_single_gen2 pipette on the right.\n2. Place opentrons_96_tiprack_20ul tip rack in slot 8.\n3. Complete Pipette offset and tip length calibrations\n4. Place the Heater Shaker in slot 2\n5. Place the labware to test on top of the Heater Shaker.",  # noqa: E501
    )
    help = "One of \n"
    for lw in hs_labware:
        help = help + lw + "\n"
    parser.add_argument("--labware_key", type=str, help=help)
    parser.add_argument("-d", action="store_true", help="debug")
    parser.add_argument(
        "--robot_ip", type=str, help="Your robot ip address like: 192.168.50.89"
    )
    args = parser.parse_args()
    DEBUG = args.d

    asyncio.run(measure(robot_ip=args.robot_ip, labware=args.labware_key))
