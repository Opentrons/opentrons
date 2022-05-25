import asyncio

from tests.integration.http_api.live import util
from tests.integration.http_api.live.base_cli import BaseCli
from tests.integration.robot_client import RobotClient


async def hs_commands(robot_ip: str) -> None:
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

        close_latch_command = {
            "data": {
                "commandType": "heaterShakerModule/closeLatch",
                "params": {
                    "moduleId": hs_id,
                },
            }
        }
        await util.execute_command(
            robot_client=robot_client, run_id=run_id, req_body=close_latch_command
        )

        open_latch_command = {
            "data": {
                "commandType": "heaterShakerModule/openLatch",
                "params": {
                    "moduleId": hs_id,
                },
            }
        }
        await util.execute_command(
            robot_client=robot_client, run_id=run_id, req_body=open_latch_command
        )


if __name__ == "__main__":

    cli = BaseCli()
    cli.parser.description = """
Check HS Commands Live
1. Have a heater shaker connected via USB and powered on.
2. The code puts the HS is slot 2 but a pipette is not interacting with it.
3. from the robot-server directory 
4. pipenv run python tests/integration/http_api/live/hs_commands.py --robot_ip ROBOT_IP
5. look at robot-server/responses.log
"""

    args = cli.parser.parse_args()
    asyncio.run(hs_commands(robot_ip=args.robot_ip))


"""
This is in robot logs
May 25 16:49:12 kansas opentrons-api[229]: Polling exception
                                           Traceback (most recent call last):
                                             File "usr/lib/python3.7/site-packages/opentrons/drivers/utils.py", line 95, in parse_labware_latch_status_response
                                           KeyError: 'STATUS'

                                           During handling of the above exception, another exception occurred:

                                           Traceback (most recent call last):
                                             File "usr/lib/python3.7/site-packages/opentrons/hardware_control/poller.py", line 142, in _poller
                                             File "usr/lib/python3.7/site-packages/opentrons/hardware_control/modules/heater_shaker.py", line 449, in read
                                             File "usr/lib/python3.7/site-packages/opentrons/drivers/heater_shaker/driver.py", line 155, in get_labware_latch_status
                                             File "usr/lib/python3.7/site-packages/opentrons/drivers/utils.py", line 99, in parse_labware_latch_status_response
                                           opentrons.drivers.utils.ParseError: ParseError(error_message=Unexpected argument to parse_labware_latch_status_response, parse_source=M241 STATE:IDLE_OPEN)
"""

"""
status_code = 200
GET http://192.168.50.89:31950/modules0.051337{
    "data": [
        {
            "id": "cf9e174e9f858b835b518a7ced84dda05172ab12",
            "serialNumber": "MDV20P20210819B12",
            "firmwareVersion": "2.0.0",
            "hardwareRevision": "mag_deck_v20",
            "hasAvailableUpdate": false,
            "moduleType": "magneticModuleType",
            "moduleModel": "magneticModuleV2",
            "data": {
                "status": "engaged",
                "engaged": true,
                "height": 10.5
            },
            "usbPort": {
                "port": 1,
                "hub": 1,
                "path": "1.0/tty/ttyACM0/dev"
            }
        },
        {
            "id": "a83c65e79b3713c851b133533757b10ec8cb2d95",
            "serialNumber": "HSDVT22041138",
            "firmwareVersion": "v0.4.3-59aaf12",
            "hardwareRevision": "Opentrons",
            "hasAvailableUpdate": false,
            "moduleType": "heaterShakerModuleType",
            "moduleModel": "heaterShakerModuleV1",
            "data": {
                "status": "idle",
                "labwareLatchStatus": "idle_unknown",
                "speedStatus": "idle",
                "currentSpeed": 0,
                "temperatureStatus": "idle",
                "currentTemperature": 25.0
            },
            "usbPort": {
                "port": 2,
                "hub": 1,
                "path": "1.0/tty/ttyACM3/dev"
            }
        },
        {
            "id": "4b611c0b8651a0fe30d4cfef9d6d915baac55381",
            "serialNumber": "TDV21P20211130D06",
            "firmwareVersion": "v2.1.0",
            "hardwareRevision": "temp_deck_v21",
            "hasAvailableUpdate": false,
            "moduleType": "temperatureModuleType",
            "moduleModel": "temperatureModuleV2",
            "data": {
                "status": "idle",
                "currentTemperature": 24.0
            },
            "usbPort": {
                "port": 4,
                "hub": 1,
                "path": "1.0/tty/ttyACM2/dev"
            }
        },
        {
            "id": "4a0bd51e1ee3eb2cd17850b83e6b7c250f25fae0",
            "serialNumber": "TCV0220211102A02",
            "firmwareVersion": "v1.1.0",
            "hardwareRevision": "v02",
            "hasAvailableUpdate": false,
            "moduleType": "thermocyclerModuleType",
            "moduleModel": "thermocyclerModuleV1",
            "data": {
                "status": "idle",
                "currentTemperature": 24.57,
                "lidStatus": "open",
                "lidTemperature": 23.75
            },
            "usbPort": {
                "port": 2,
                "path": "1.0/tty/ttyACM1/dev"
            }
        }
    ],
    "meta": {
        "cursor": 0,
        "totalLength": 4
    }
}
status_code = 201
POST http://192.168.50.89:31950/runs4.559605 *LONG*{
    "data": {
        "id": "0c5fd44b-371b-4d1f-8c52-d42fd2355bfa",
        "createdAt": "2022-05-25T16:52:24.415019+00:00",
        "status": "idle",
        "current": true,
        "actions": [],
        "errors": [],
        "pipettes": [],
        "labware": [
            {
                "id": "fixedTrash",
                "loadName": "opentrons_1_trash_1100ml_fixed",
                "definitionUri": "opentrons/opentrons_1_trash_1100ml_fixed/1",
                "location": {
                    "slotName": "12"
                }
            }
        ],
        "labwareOffsets": []
    }
}
status_code = 201
POST http://192.168.50.89:31950/runs/0c5fd44b-371b-4d1f-8c52-d42fd2355bfa/commands?waitUntilComplete=true0.077322{
    "data": {
        "id": "65bbcd43-2443-4806-ab39-7f7dab044509",
        "createdAt": "2022-05-25T16:52:28.973642+00:00",
        "commandType": "loadModule",
        "key": "65bbcd43-2443-4806-ab39-7f7dab044509",
        "status": "succeeded",
        "params": {
            "model": "heaterShakerModuleV1",
            "location": {
                "slotName": "2"
            },
            "moduleId": "a83c65e79b3713c851b133533757b10ec8cb2d95"
        },
        "result": {
            "moduleId": "a83c65e79b3713c851b133533757b10ec8cb2d95",
            "definition": {
                "otSharedSchema": "module/schemas/2",
                "moduleType": "heaterShakerModuleType",
                "model": "heaterShakerModuleV1",
                "labwareOffset": {
                    "x": -0.125,
                    "y": 1.125,
                    "z": 68.275
                },
                "dimensions": {
                    "bareOverallHeight": 82.0,
                    "overLabwareHeight": 0.0
                },
                "calibrationPoint": {
                    "x": 12.0,
                    "y": 8.75,
                    "z": 68.275
                },
                "displayName": "Heater-Shaker Module GEN1",
                "quirks": [],
                "slotTransforms": {
                    "ot2_standard": {
                        "3": {
                            "labwareOffset": [
                                [
                                    -1,
                                    0,
                                    0
                                ],
                                [
                                    0,
                                    -1,
                                    0
                                ],
                                [
                                    0,
                                    0,
                                    1
                                ]
                            ]
                        },
                        "6": {
                            "labwareOffset": [
                                [
                                    -1,
                                    0,
                                    0
                                ],
                                [
                                    0,
                                    -1,
                                    0
                                ],
                                [
                                    0,
                                    0,
                                    1
                                ]
                            ]
                        },
                        "9": {
                            "labwareOffset": [
                                [
                                    -1,
                                    0,
                                    0
                                ],
                                [
                                    0,
                                    -1,
                                    0
                                ],
                                [
                                    0,
                                    0,
                                    1
                                ]
                            ]
                        }
                    },
                    "ot2_short_trash": {
                        "3": {
                            "labwareOffset": [
                                [
                                    -1,
                                    0,
                                    0
                                ],
                                [
                                    0,
                                    -1,
                                    0
                                ],
                                [
                                    0,
                                    0,
                                    1
                                ]
                            ]
                        },
                        "6": {
                            "labwareOffset": [
                                [
                                    -1,
                                    0,
                                    0
                                ],
                                [
                                    0,
                                    -1,
                                    0
                                ],
                                [
                                    0,
                                    0,
                                    1
                                ]
                            ]
                        },
                        "9": {
                            "labwareOffset": [
                                [
                                    -1,
                                    0,
                                    0
                                ],
                                [
                                    0,
                                    -1,
                                    0
                                ],
                                [
                                    0,
                                    0,
                                    1
                                ]
                            ]
                        }
                    }
                },
                "compatibleWith": []
            },
            "model": "heaterShakerModuleV1",
            "serialNumber": "HSDVT22041138"
        },
        "startedAt": "2022-05-25T16:52:28.975734+00:00",
        "completedAt": "2022-05-25T16:52:28.999307+00:00"
    }
}
status_code = 201
POST http://192.168.50.89:31950/runs/0c5fd44b-371b-4d1f-8c52-d42fd2355bfa/commands?waitUntilComplete=true2.305496 *LONG*{
    "data": {
        "id": "ea7ccf66-67e4-4444-b805-6d3f9685189e",
        "createdAt": "2022-05-25T16:52:29.056941+00:00",
        "commandType": "heaterShakerModule/closeLatch",
        "key": "ea7ccf66-67e4-4444-b805-6d3f9685189e",
        "status": "failed",
        "params": {
            "moduleId": "a83c65e79b3713c851b133533757b10ec8cb2d95"
        },
        "error": {
            "id": "4e300206-2c2a-48b4-ba0b-fbc525012c40",
            "errorType": "UnexpectedProtocolError",
            "createdAt": "2022-05-25T16:52:31.309976+00:00",
            "detail": "ParseError(error_message=Unexpected argument to parse_labware_latch_status_response, parse_source=M241 STATE:IDLE_CLOSED)"
        },
        "startedAt": "2022-05-25T16:52:29.059099+00:00",
        "completedAt": "2022-05-25T16:52:31.309976+00:00"
    }
}
status_code = 201
POST http://192.168.50.89:31950/runs/0c5fd44b-371b-4d1f-8c52-d42fd2355bfa/commands?waitUntilComplete=true2.725859 *LONG*{
    "data": {
        "id": "be04bcd7-f9a5-4467-9137-95c48232bec0",
        "createdAt": "2022-05-25T16:52:31.381805+00:00",
        "commandType": "heaterShakerModule/openLatch",
        "key": "be04bcd7-f9a5-4467-9137-95c48232bec0",
        "status": "failed",
        "params": {
            "moduleId": "a83c65e79b3713c851b133533757b10ec8cb2d95"
        },
        "error": {
            "id": "db21f470-d9d1-477b-9eb9-5d0b5b06cfd5",
            "errorType": "UnexpectedProtocolError",
            "createdAt": "2022-05-25T16:52:34.040908+00:00",
            "detail": "ParseError(error_message=Unexpected argument to parse_labware_latch_status_response, parse_source=M241 STATE:IDLE_OPEN)"
        },
        "startedAt": "2022-05-25T16:52:31.383576+00:00",
        "completedAt": "2022-05-25T16:52:34.040908+00:00"
    }
}
"""