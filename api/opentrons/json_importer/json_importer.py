from collections import OrderedDict
import json
import os

from opentrons import containers
from opentrons import instruments
from opentrons import Robot
from opentrons.util import vector


class JSONProcessorValidationError(Exception):
    pass


class JSONProcessorRuntimeError(Exception):
    pass


class JSONProtocolProcessor(object):
    def __init__(self, protocol: (str, OrderedDict)):
        self.errors = []
        self.warnings = []
        self.deck = None
        self.head = None
        self.protocol = self.read_protocol(protocol)

    @staticmethod
    def get_protocol_from_file(path):
        with open(path) as f:
            return json.load(f, object_pairs_hook=OrderedDict)

    def read_protocol(self, protocol):
        if isinstance(protocol, str):
            if os.path.isfile(protocol):
                return self.get_protocol_from_file(protocol)
            return json.loads(protocol, object_pairs_hook=OrderedDict)
        elif isinstance(protocol, OrderedDict):
            return protocol
        raise Exception('Protocol must be a file, json string, or OrderedDict')

    def validate(self):
        errors = []
        warnings = []

        # Process errors
        if 'head' not in self.protocol:
            errors.append('JSON Protocol is missing "HEAD" section')
        if 'deck' not in self.protocol:
            errors.append('JSON Protocol is missing "DECK" section')
        if 'instructions' not in self.protocol:
            errors.append('JSON Protocol is missing "INSTRUCTIONS" section')

        # Process warnings
        if 'ingredients' not in self.protocol:
            warnings.append(
                'JSON Protocol section "Ingredients" will not be used'
            )

        self.warnings.extend(warnings)
        self.errors.extend(errors)

        if errors:
            raise JSONProcessorValidationError(
                'Errors encountered compiling JSON'
            )

    def process(self):
        try:
            self.process_deck()
        except JSONProcessorRuntimeError as e:
            self.errors.append(
                'Failed to process protocol "deck". {}'
                .format(str(e))
            )

        try:
                self.process_head()
        except JSONProcessorRuntimeError as e:
            self.errors.append(
                'Failed to process protocol "head". {}'
                .format(str(e))
            )

        try:
            self.process_instructions()
        except JSONProcessorRuntimeError as e:
            self.errors.append(
                'Failed to process protocol "instructions". {}'
                .format(str(e))
            )

        if self.errors:
            raise JSONProcessorRuntimeError(
                'Encountered error processing JSON'
            )

    def get_unallocated_slot(self):
        """
        :return: str name of a slot without any children (first occurence)
        """
        robot = Robot.get_instance()
        for slot in robot._deck.get_children_list():
            if not slot.has_children():
                return slot.get_name()
        raise JSONProcessorRuntimeError(
            'Unable to find any unallocated slots in robot deck'
        )

    def process_deck(self):
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
        :return:
        """

        deck_info = self.protocol['deck']

        deck_data = {}
        for container_label, definition in deck_info.items():
            try:
                container_type = definition.get('labware')
            except KeyError:
                raise JSONProcessorRuntimeError(
                    'Labware and Slot are required items for "{}" container '
                    'definition'.format(container_label)
                )

            slot = definition.get('slot')
            if not slot:
                slot = self.get_unallocated_slot()
                self.warnings.append(
                    'No SLOT was associated with container "{}", auto '
                    'assigning container to slot {}'
                    .format(container_label, slot)
                )

            container_obj = containers.load(
                container_type, slot, container_label
            )
            deck_data[container_label] = {'instance': container_obj}
        self.deck = deck_data

    def process_head(self):
        """
        res example:
        { name: {
            'instance': ..,
            'settings': {'down-plunger-speed', '
            }
        }
        :return:
        """

        head_dict = self.protocol['head']

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

        for tool_name, tool_config in head_dict.items():
            # Validate tool_config keys
            # Create a warning if unknown keys are detected
            user_provided_tool_options = set(tool_config.keys())
            if not (SUPPORTED_TOOL_OPTIONS >= user_provided_tool_options):
                invalid_options = (
                    user_provided_tool_options - SUPPORTED_TOOL_OPTIONS
                )
                self.warnings.append(
                    'Encountered unsupported tool options for "{}": {}'
                    .format(tool_name, ', '.join(invalid_options))
                )

            tool_config.pop('tool')

            # robot_containers = robot._deck.containers()
            tip_rack_objs = [
                self.deck[item['container']]['instance']
                for item in tool_config.pop('tip-racks')
            ]
            tool_config['tip-racks'] = tip_rack_objs

            trash_obj = self.deck[
                tool_config.pop('trash-container')['container']
            ]['instance']
            tool_config['trash-container'] = trash_obj

            tool_config['points'] = [
                dict(i) for i in tool_config.pop('points')
            ]

            tool_instance = instruments.Pipette(
                name=tool_name,
                axis=tool_config.pop('axis'),
                max_volume=tool_config.pop('volume'),
                min_volume=0,
                channels=(8 if tool_config.pop('multi-channel') else 1),
                tip_racks=tip_rack_objs,
                trash_container=trash_obj
            )

            head_obj[tool_name] = {
                'instance': tool_instance,
                'settings': dict(tool_config)
            }

        self.head = head_obj

    def validate_instructions(self, instructions):
        nonexistent_tools = []
        for instruction_dict in instructions:
            tool_name = instruction_dict.get('tool')
            if tool_name not in self.head:
                nonexistent_tools.append(tool_name)

        if nonexistent_tools:
            raise JSONProcessorRuntimeError(
                'The following tools have not been defined in the "head" '
                'section but are being called for usage in instructions: {}'
                .format(str(nonexistent_tools))
            )

    def process_instructions(self):
        """
        [
            {
                "tool" : "p10",
                "groups" : [
                    {
                        "transfer" : [
                            {
                                "from" : {
                                    "container": "plate",
                                    "location": "F1",
                                    "touch-tip": false
                                },
                                "to": {
                                    "container" : "plate",
                                    "location" : "A12",
                                    "tip-offset" : 0,
                                    "delay" : 0,
                                    "touch-tip" : false
                                },
                                    "volume" : 10
                            },
                            {
                                "from" : {
                                    "container": "plate",
                                    "location": "D1",
                                    "touch-tip": false
                                },
                                "to": {
                                    "container" : "plate",
                                    "location" : "A2",
                                    "tip-offset" : 0,
                                    "delay" : 0,
                                    "touch-tip" : false
                                },
                                    "volume" : 10
                            }
                        ]
        :param robot_deck:
        :param robot_head:
        :param instructions:
        :return:
        """

        instructions = self.protocol['instructions']

        self.validate_instructions(instructions)

        for instruction_dict in instructions:
            tool_name = instruction_dict.get('tool')
            tool_obj = self.head[tool_name]['instance']

            for group in instruction_dict.get('groups'):
                # We always pick up a new tip when entering a group
                tool_obj.pick_up_tip()

                for command_type, commands_calls in group.items():
                    def handler_ftn(command_args):
                        return self.process_command(
                            tool_obj, command_type, command_args
                        )

                    if isinstance(commands_calls, list):
                        [handler_ftn(command_arg)
                         for command_arg in commands_calls]

                    # Note: Distribute command does not have an array of calls
                    # but rather a dict with the distribute call info
                    elif isinstance(commands_calls, dict):
                        handler_ftn(commands_calls)

                # LEAVING GROUP
                tool_obj.drop_tip()

    def process_command(self, tool_obj, command, command_args):
        SUPPORTED_COMMANDS = {
            'transfer': self.handle_transfer,
            'distribute': self.handle_distribute,
            'mix': self.handle_mix,
            'consolidate': self.handle_consolidate
        }
        if command not in SUPPORTED_COMMANDS:
            raise JSONProcessorRuntimeError(
                'Unsupported COMMAND "{}" encountered'.format(command)
            )
        return SUPPORTED_COMMANDS[command](tool_obj, command_args)

    def handle_transfer(self, tool_obj, command_args):
        # TODO: validate command args
        volume = command_args.get('volume', tool_obj.max_volume)
        tool_settings = self.head[tool_obj.name]['settings']
        should_extra_pull = command_args.get('extra-pull', False)

        self.handle_transfer_from(
            tool_obj,
            tool_settings,
            command_args['from'],
            volume,
            should_extra_pull
        )
        self.handle_transfer_to(tool_obj, command_args['to'], volume)

    def get_well_obj(self, info_dict):
        try:
            container_name = info_dict['container']
        except KeyError:
            raise JSONProcessorRuntimeError(
                'No container was specified for "transfer" command. "{}"'
                .format(str(info_dict))
            )

        try:
            container_obj = self.deck[container_name]['instance']
        except KeyError:
            raise JSONProcessorRuntimeError(
                'JSON Protocol references a container that has not been '
                'defined in the "deck" section: "{}"'.format(container_name)
            )

        well_name = None
        try:
            well_name = info_dict['location']
            well_obj = container_obj[well_name]
        except KeyError:
            raise JSONProcessorRuntimeError(
                'JSON Protocol references a well that does not exist in '
                'container: {}:{}'
                .format(container_obj.get_name(), well_name)
            )
        return well_obj

    def handle_transfer_from(
            self,
            tool_obj,
            tool_settings,
            from_info,
            volume,
            extra_pull=False
    ):
        extra_pull_delay = (
            tool_settings.get('extra-pull-delay', 0)
            if extra_pull
            else 0
        )
        extra_pull_volume = (
            tool_settings.get('extra-pull-volume', 0)
            if extra_pull
            else 0
        )

        from_well = self.get_well_obj(from_info)

        should_touch_tip_on_from = from_info.get('touch-tip', False)
        from_tip_offset = from_info.get('tip-offset', 0)
        from_delay = from_info.get('delay', 0)

        from_location = (
            from_well,
            from_well.from_center(x=0, y=0, z=-1) +
            vector.Vector(0, 0, from_tip_offset)
        )

        tool_obj.aspirate(volume + extra_pull_volume, from_location)
        if extra_pull_delay > 0:
            tool_obj.delay(extra_pull_delay)
        if extra_pull_volume > 0:
            tool_obj.dispense(extra_pull_volume)
        if should_touch_tip_on_from:
            tool_obj.touch_tip()
        if from_delay > 0:
            tool_obj.delay(from_delay)

    def handle_transfer_to(self, tool_obj, to_info, volume):
        to_well = self.get_well_obj(to_info)

        should_touch_tip_on_to = to_info.get('touch-tip', False)
        to_tip_offset = to_info.get('tip-offset', 0)
        to_delay = to_info.get('delay', 0)
        blowout = to_info.get('blowout', False)

        to_location = (
            to_well,
            to_well.from_center(x=0, y=0, z=-1) +
            vector.Vector(0, 0, to_tip_offset)
        )

        tool_obj.dispense(volume, to_location)
        if blowout:
            tool_obj.blow_out(to_location)

        if should_touch_tip_on_to:
            tool_obj.touch_tip()

        if to_delay is not None:
            tool_obj.delay(to_delay)

    def handle_distribute(self, tool_obj, command_args):
        tool_settings = self.head[tool_obj.name]['settings']

        from_info = command_args['from']
        to_info_list = command_args['to']

        total_to_volume = sum(to_info['volume'] for to_info in to_info_list)
        distribute_percent = tool_settings.get('distribute-percentage', 0)

        from_volume = total_to_volume * (1 + distribute_percent)

        from_volume = min(from_volume, tool_obj.max_volume)

        self.handle_transfer_from(
            tool_obj,
            tool_settings,
            from_info,
            from_volume
        )

        for to_info in to_info_list:
            self.handle_transfer_to(tool_obj, to_info, to_info['volume'])

    def handle_mix(self, tool_obj, command_args):
        volume = command_args.get('volume', tool_obj.max_volume)
        from_container = self.deck[command_args['container']]['instance']
        from_well = from_container[command_args['location']]

        repetitions = command_args.get('repetitions', 0)

        tool_obj.mix(
            repetitions=repetitions, volume=volume, location=from_well
        )

        if command_args.get('blow-out'):
            tool_obj.robot.move_to_top(
                from_well, instrument=tool_obj, create_path=False
            )
            tool_obj.blow_out()

    def handle_consolidate(self, tool_obj, command_args):
        tool_settings = self.head[tool_obj.name]['settings']

        from_info_list = command_args['from']
        to_info = command_args['to']

        total_volume = sum(from_info['volume'] for from_info in from_info_list)

        for from_info in from_info_list:
            self.handle_transfer_from(
                tool_obj,
                tool_settings,
                from_info,
                from_info['volume']
            )
        self.handle_transfer_to(tool_obj, to_info, total_volume)
