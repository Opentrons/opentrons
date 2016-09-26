from opentrons_sdk.labware import containers, deck, instruments
from opentrons_sdk.labware.grid import normalize_position, humanize_position
import opentrons_sdk.drivers.motor as motor_drivers
from opentrons_sdk.util.log import debug
from opentrons_sdk.protocol.handlers import ContextHandler, MotorControlHandler

import copy


class Protocol():

    _ingredients = None  # { 'name': "A1:A1" }

    _instruments = None  # { motor_axis: instrument }

    _container_labels = None  # Aliases. { 'foo': (0,0), 'bar': (0,1) }

    _commands = None  # []

    _handlers = None  # List of attached handlers for run_next.

    # Context and Motor are important handlers, so we provide
    # a way to get at them.
    _context_handler = None  # Operational context (virtual robot).
    _motor_handler = None

    _containers = None  # { slot: container_name }

    _instance = None

    @classmethod
    def get_instance(cls):
        if not cls._instance or not isinstance(cls._instance, cls):
            cls._instance = cls()
        return cls._instance

    @classmethod
    def reset(cls):
        """
        Use this for testing
        :return:
        """
        Protocol._instance = None
        return Protocol.get_instance()

    def __init__(self):
        self._ingredients = {}
        self._container_labels = {}
        self._instruments = {}
        self._containers = {}
        self._commands = []
        self._handlers = []
        self._initialize_context()

    def add_container(self, slot, name):
        container_obj = self._context_handler.add_container(slot, name)
        self._containers[slot] = name
        return container_obj



    def add_instrument(self, axis, instrument=None):
        # TODO: Do we really want to keep this object in sync with what is in
        # ContextHandler inst obj
        # self._instruments[axis] = name
        self._context_handler.add_instrument(axis, instrument)

    def add_ingredient(self, name, location):
        pass

    def allocate(self, **kwargs):
        pass

    def calibrate(self, position, **kwargs):
        if ':' in position:
            pos = self._normalize_address(position)
        else:
            pos = normalize_position(position)
        self._context_handler.calibrate(pos, **kwargs)

    def calibrate_instrument(self, axis, top=None, blowout=None, droptip=None,
                             bottom=None):
        self._context_handler.calibrate_instrument(
            axis, top=top, bottom=bottom, blowout=blowout, droptip=droptip
        )

    def add_command(self, command, **kwargs):
        self._run_in_context_handler(command, **kwargs)
        self._commands.append({command: kwargs})

    def transfer(self, start, end, ul=None, ml=None,
                 blowout=True, touchtip=True, tool=None):
        if ul:
            volume = ul
        else:
            volume = ml * 1000
        if tool is None:
            inst = self._context_handler.get_instrument(volume=volume)
            tool = inst.name
        self.add_command(
            'transfer',
            volume=volume,
            tool=tool,
            start=self._normalize_address(start),
            end=self._normalize_address(end),
            blowout=blowout,
            touchtip=touchtip
        )

    def transfer_group(self, *wells, ul=None, ml=None, **defaults):
        if ul:
            volume = ul
        elif ml:
            volume = ul * 1000
        else:
            volume = None
        defaults.update({
            'touchtip': True,
            'blowout': True,
            'volume': volume
        })
        transfers = []
        for item in wells:
            options = defaults.copy()
            if len(item) is 3:
                start, end, opts = item
                options.update(opts)
            else:
                start, end = item
            vol = options.get('ul') or options.get('ml', 0) * 1000
            vol = vol or volume
            transfers.append({
                'volume': vol,
                'start': self._normalize_address(start),
                'end': self._normalize_address(end),
                'blowout': options['blowout'],
                'touchtip': options['touchtip']
            })
        self.add_command(
            'transfer_group',
            tool=options['tool'],
            transfers=transfers
        )

    def distribute(self, start, *wells, blowout=True):
        transfers = []
        for item in wells:
            end, volume = item
            transfers.append({
                'volume': volume,
                'end': self._normalize_address(end)
            })
        self.add_command(
            'distribute',
            tool='p10',
            start=self._normalize_address(start),
            blowout=blowout,
            transfers=transfers
        )

    def consolidate(self, end, *wells, blowout=True):
        transfers = []
        for item in wells:
            start, volume = item
            transfers.append({
                'volume': volume,
                'start': self._normalize_address(start)
            })
        self.add_command(
            'consolidate',
            tool='p10',
            end=self._normalize_address(end),
            blowout=blowout,
            transfers=transfers
        )

    def mix(self, start, volume=None, repetitions=None, blowout=True):
        self.add_command(
            'mix',
            tool='p10',
            start=self._normalize_address(start),
            blowout=blowout,
            volume=volume,
            reps=repetitions
        )

    @property
    def actions(self):
        return copy.deepcopy(self._commands)

    def _get_slot(self, name):
        """
        Returns a container within a given slot, can take a slot position
        as a tuple (0, 0) or as a user-friendly name ('A1') or as a label
        ('ingredients').
        """
        slot = None

        try:
            slot = normalize_position(name)
        except TypeError:
            if slot in self._container_labels:
                slot = self._container_labels[slot]

        if not slot:
            raise KeyError("Slot not defined: " + name)
        if slot not in self._deck:
            raise KeyError("Nothing in slot: " + name)

        return self._deck[slot]

    def _normalize_address(self, address):
        """
        Takes an address like "A1:A1" or "Ingredients:A1" and returns a tuple
        like (0, 0) or ('ingredients', 0).

        Container labels are retained in the address tuples so that named
        containers can be assigned to different slots within the user
        interface.
        """

        if ':' not in address:
            raise ValueError(
                "Address must be in the form of 'container:well'."
            )

        container, well = address.split(':')
        well = normalize_position(well)

        try:
            container = normalize_position(container)
        except ValueError:
            container = container.lower()
            if container not in self._container_labels:
                raise KeyError("Container not found: {}".format(container))

        return (container, well)

    def run(self):
        """
        A generator that runs each command and yields the current command
        index and the number of total commands.
        """
        self._initialize_context()
        i = 0
        yield(0, len(self._commands))
        while i < len(self._commands):
            cur = self._commands[i]
            command = list(cur)[0]
            args = cur[command]
            self._run(i)
            i += 1
            yield (i, len(self._commands))

    def run_all(self):
        """
        Convenience method to run every command in a protocol.

        Useful for when you don't care about the progress.
        """
        for _ in self.run():
            pass

    def _initialize_context(self):
        """
        Initializes the context.
        """
        calibration = None
        if self._context_handler:
            calibration = self._context_handler._calibration
        self._context_handler = ContextHandler(self)
        for slot, name in self._containers.items():
            self._context_handler.add_container(slot, name)
        for axis, name in self._instruments.items():
            self._context_handler.add_instrument(axis, name)
        if calibration:
            self._context_handler._calibration = calibration

    def _run_in_context_handler(self, command, **kwargs):
        """
        Runs a command in the virtualized context.

        This is useful for letting us know if there's a problem with a
        particular command without having to wait to run it on the robot.

        If you use this on your own you're going to end up with weird state
        bugs that have nothing to do with the protocol.
        """
        method = getattr(self._context_handler, command)
        if not method:
            raise KeyError("Command not defined: " + command)
        method(**kwargs)

    def _run(self, index):
        cur = self._commands[index]
        command = list(cur)[0]
        kwargs = cur[command]
        self._run_in_context_handler(command, **kwargs)
        for h in self._handlers:
            debug(
                "Protocol",
                "{}.{}: {}"
                .format(type(h).__name__, command, kwargs)
            )
            h.before_each()
            method = getattr(h, command)
            method(**kwargs)
            h.after_each()

    def attach_handler(self, handler_class):
        """
        When you attach a handler, commands are run on the handler in sequence
        when Protocol.run_next() is called.

        You don't have to attach the ContextHandler, you get that for free.
        It's a good example implementation of what these things are
        supposed to do.

        Any command that the robot supports must be present on the Handler
        you pass in, or you'll get exceptions. Just make sure you subclass
        from ProtocolHandler and you'll be fine; empty methods are stubbed
        out for all supported commands.

        Pass in the class, not an instance. This method returns the
        instantiated object, which you can use to do any additional setup
        required for the particular Handler.
        """
        handler = handler_class(self, self._context_handler)
        self._handlers.append(handler)
        return handler

    def attach_motor(self, port=None):
        self._motor_handler = self.attach_handler(MotorControlHandler)
        if port is not None:
            self._motor_handler.connect(port)
        else:
            self._motor_handler.simulate()
        return self._motor_handler

    def disconnect(self):
        if self._motor_handler:
            self._motor_handler.disconnect()


    def get_containers(self):
        return self._context_handler.get_containers()

    def get_instruments(self):
        return self._context_handler.get_instruments()

    def get_deck(self):
        return self._context_handler.get_deck()
