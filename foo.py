from opentrons_sdk.json_importer import JSONProtocolProcessor
from opentrons_sdk.helpers.helpers import import_calibration_json
from opentrons_sdk.robot import Robot

robo = Robot.get_instance()


# logging_config = dict(
#     version=1,
#     formatters={
#         'basic': {
#             'format': '%(asctime)s %(name)s %(levelname)s [Line %(lineno)s]     %(message)s'  #NOQA
#         }
#     },
#     handlers={
#         'debug': {
#             'class': 'logging.StreamHandler',
#             'formatter': 'basic',
#             'level': logging.DEBUG},
#         'development': {
#             'class': 'logging.StreamHandler',
#             'formatter': 'basic',
#             'level': logging.WARNING},
#     },
#     root={
#         'handlers': ['debug'],
#     },
# )
# from logging.config import dictConfig

calibration_data = """
{
    "a": {
        "blowout": 21,
        "bottom": 19,
        "droptip": 24,
        "resting": 0,
        "theContainers": {
            "liquid_waste": {
                "rel_x": null,
                "rel_y": null,
                "rel_z": null,
                "x": null,
                "y": null,
                "z": null
            },
            "p1000-rack": {
                "rel_x": null,
                "rel_y": null,
                "rel_z": null,
                "x": null,
                "y": null,
                "z": null
            },
            "rack_large": {
                "rel_x": null,
                "rel_y": null,
                "rel_z": null,
                "x": null,
                "y": null,
                "z": null
            },
            "rack_small": {
                "rel_x": null,
                "rel_y": null,
                "rel_z": null,
                "x": null,
                "y": null,
                "z": null
            },
            "trash": {
                "x": 120,
                "y": 190,
                "z": 100
            }
        },
        "tip_rack_origin": "",
        "tip_racks": [],
        "top": 2.5,
        "trash_container": [],
        "volume": 10
    },
    "b": {
        "blowout": 13.899,
        "bottom": 22.299,
        "droptip": 25.799,
        "resting": 0,
        "theContainers": {
            "liquid_waste": {
                "rel_x": 126.38900000000001,
                "rel_y": -285.207,
                "rel_z": -116.998,
                "x": 160.0,
                "y": 92.0,
                "z": 0.0
            },
            "p1000-rack": {
                "rel_x": 0.0,
                "rel_y": 0.0,
                "rel_z": 0.0,
                "x": 33.611,
                "y": 377.207,
                "z": 116.998
            },
            "rack_large": {
                "rel_x": 186.401,
                "rel_y": -142.201,
                "rel_z": -106.501,
                "x": 220.012,
                "y": 235.006,
                "z": 10.497
            },
            "rack_small": {
                "rel_x": 95.88300000000001,
                "rel_y": -134.71699999999998,
                "rel_z": -57.499,
                "x": 129.494,
                "y": 242.49,
                "z": 59.499
            },
            "trash": {
                "rel_x": 130.203,
                "rel_y": -77.49599999999998,
                "rel_z": -111.8,
                "x": 160.0,
                "y": 300.0,
                "z": 0.0
            }
        },
        "tip_rack_origin": "p1000-rack",
        "tip_racks": [
            {
                "container": "p1000-rack"
            }
        ],
        "top": 6.3,
        "trash_container": {
            "container": "trash"
        },
        "volume": 1000
    }
}
"""
import_calibration_json(calibration_data, robo, True)

jpp = JSONProtocolProcessor(
    '/Users/ahmed/Downloads/otone_data-5/protocol.json')

jpp.process()

cmds = [i.description for i in robo._commands]

robo.connect()
robo.run(mode='simulate_switches')
