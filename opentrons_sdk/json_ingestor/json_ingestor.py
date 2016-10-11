from collections import OrderedDict

from opentrons_sdk import containers


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


def interpret_head(protocol, head_dict):
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
