from collections import OrderedDict

from opentrons_sdk import containers
from opentrons_sdk.labware import instruments
from opentrons_sdk.robot import Robot


def interpret_json_protocol(json_protocol : OrderedDict):
    protocol = {
        'containers': {},
        'instruments': {}
    }
    protocol['containers'] = interpret_deck(json_protocol['deck'])
    protocol['head'] = interpret_head(json_protocol['head'])


def interpret_deck(deck_info : OrderedDict):
    """
    "deck": {
        "p200-rack": {
            "labware": "tiprack-200ul",
            "slot" : "A1"
        },
        ".75 mL Tube Rack": {
            "labware": "tube-rack-.75ml",
            "slot" : "C1"
        },
        "trash": {
            "labware": "point",
            "slot" : "B2"
        }
    }
    :param protocol:
    :param deck_info:
    :return:
    """

    containers_data = {}
    for name, definition in deck_info.items():
        container_type = definition.get('labware')
        slot = definition.get('slot')
        container_obj = containers.load(container_type, slot, name)
        containers_data[name] = {'instance': container_obj}
    return containers_data


def interpret_head(head_dict):
    """
    res example:
    { name: {
        'instance': ..,
        'settings': {'down-plunger-speed', '
        }
    }

    :param protocol:
    :param head_dict:
    :return:
    """

    SUPPORTED_TOOL_OPTIONS = {
        'tool',
        'tip-racks',
        'trash-container',
        'multi-channel',
        'axis',
        'volume',
        'down-plunger-speed',
        'up-plunger-speed',
        'tip-plunge',
        'extra-pull-volume',
        'extra-pull-delay',
        'distribute-percentage',
        'points'
    }


    head_obj = {}
    robot = Robot.get_instance()

    for tool_name, tool_config in head_dict.items():
        # Validate tool_config keys
        assert SUPPORTED_TOOL_OPTIONS >= set(tool_config.keys())

        tool_instance = instruments.Pipette(
            name=tool_name,
            axis=tool_config.pop('axis'),
            min_volume=0,
            channels=(1 if tool_config.pop('multi-channel') else 8),
        )

        robot_containers = robot._deck.containers()
        tip_rack_objs = [
            robot_containers[name]
            for name in tool_config.pop('tip-racks')
        ]
        tool_config['tip-racks'] = tip_rack_objs

        trash_obj = robot_containers[tool_config.pop('trash-container')]
        tool_config['trash-container'] = trash_obj

        head_obj[tool_name] = {
            'instance': tool_instance,
            'settings': tool_config
        }
    return head_obj


# def interpret_instructions(protocol, instructs_dict):
#     referenced_tool = instructs_dict.get('tool')
#     tool_obj = protocol.get(referenced_tool)
#
#     for group in instructs_dict.get('groups'):
#         tool_obj.new_tip()
#         for command, command_args in group:
#             handle(command, command_args)
#
#             def handle_transfer(tool, args)
#                 refs_loc = ..tool_obj
#                 get
#                 tool.aspirate(args.get('volume'), )
