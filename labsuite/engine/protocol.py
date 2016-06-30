from labsuite.labware import containers, deck
from labsuite.labware.grid import normalize_position
from labsuite.engine.context import Context
import labsuite.drivers.motor as motor_drivers

import copy


class Protocol():

    _ingredients = None  # { 'name': "A1:A1" }

    _context = None  # Operational context (virtual robot).

    _instruments = None  # { 'A': instrument, 'B': instrument }

    _container_labels = None  # Aliases. { 'foo': (0,0), 'bar': (0,1) }

    _commands = None  # []

    _command_index = 0  # Index of the running command.

    _handlers = None  # List of attached handlers for run_next.

    def __init__(self):
        self._ingredients = {}
        self._container_labels = {}
        self._commands = []
        self._context = ContextHandler(self)
        self._handlers = []

    def add_container(self, slot, name, label=None):
        slot = normalize_position(slot)
        self._context.add_container(slot, name)
        if (label):
            label = label.lower()
            self._container_labels[label] = slot

    def add_instrument(self, *args, **kwargs):
        pass

    def add_ingredient(self, name, location):
        pass

    def allocate(self, **kwargs):
        pass

    def calibrate(self, *args, **kwargs):
        self._context.calibrate(*args, **kwargs)

    def transfer(self, start, end, ul=None, ml=None,
                 blowout=True, touchtip=True):
        if ul:
            volume = ul
        else:
            volume = ml * 1000

        self._commands.append({
            'transfer': {
                'tool': 'p10',
                'volume': volume,
                'start': self._normalize_address(start),
                'end': self._normalize_address(end),
                'blowout': blowout,
                'touchtip': touchtip
            }
        })

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
        self._commands.append({
            'transfer_group': {
                'tool': 'p10',
                'transfers': transfers
            }
        })

    def distribute(self, start, *wells, blowout=True):
        transfers = []
        for item in wells:
            end, volume = item
            transfers.append({
                'volume': volume,
                'end': self._normalize_address(end)
            })
        self._commands.append({'distribute': {
            'tool': 'p10',
            'start': self._normalize_address(start),
            'blowout': blowout,
            'transfers': transfers
        }})

    def consolidate(self, end, *wells, blowout=True):
        transfers = []
        for item in wells:
            start, volume = item
            transfers.append({
                'volume': volume,
                'start': self._normalize_address(start)
            })
        self._commands.append({'consolidate': {
            'tool': 'p10',
            'end': self._normalize_address(end),
            'blowout': blowout,
            'transfers': transfers
        }})

    def mix(self, start, volume=None, repetitions=None, blowout=True):
        self._commands.append({'mix': {
            'tool': 'p10',
            'start': self._normalize_address(start),
            'blowout': blowout,
            'volume': volume,
            'reps': repetitions
        }})

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

    def run_next(self):
        i = self._command_index
        next_command = self._commands[self._command_index]
        cur = self._commands[i]
        command = list(cur)[0]
        self._run(command, cur[command])
        self._command_index += 1

    def _run(self, command, kwargs):
        method = getattr(self._context, command)
        if not method:
            raise KeyError("Command not defined: " + command)
        method(**kwargs)
        for h in self._handlers:
            method = getattr(h, command)
            method(**kwargs)

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
        handler = handler_class(self, self._context)
        self._handlers.append(handler)
        return handler


class ProtocolHandler():

    """
    Empty interface that all ProtocolHandlers should support.  If a command
    isn't officially supported, it'll just be silently ignored.

    Normalization doesn't happen here. Don't call these classes directly,
    let the Protocol do its work first and run things internally.

    Do not do validation in these handlers. Don't do it.

    Use Protocol.attach to attach a handler.
    """

    _context = None
    _protocol = None  # Don't touch the protocol, generally.

    def __init__(self, protocol, context=None):
        self._context = context
        self._protocol = protocol
        self.setup()

    def setup(self):
        """
        Whatever setup you need to do for your context, do it here.
        """
        pass

    def transfer(self, start=None, end=None, volume=None, **kwargs):
        pass

    def transfer_group(self, *transfers):
        pass

    def distribute(self):
        pass

    def mix(self):
        pass

    def consolidate(self):
        pass


class ContextHandler(ProtocolHandler):

    """
    ContextHandler runs all the stuff on the virtual robot in the background
    and makes relevant data available.
    """

    _deck = None

    def setup(self):
        self._deck = deck.Deck()

    def add_container(self, slot, container_name):
        self._deck.add_module(slot, container_name)

    def calibrate(self, slot, x=None, y=None, z=None):
        self._deck.calibrate(**{slot: {'x': x, 'y': y, 'z': z}})

    def get_coordinates(self, position):
        """ Returns the calibrated coordinates for a position. """
        slot, well = position
        return self._deck.slot(slot).well(well).coordinates()

    def get_volume(self, well):
        slot, well = self._protocol._normalize_address(well)
        return self._deck.slot(slot).well(well).get_volume()

    def transfer(self, start=None, end=None, volume=None, **kwargs):
        start_slot, start_well = start
        end_slot, end_well = end
        start = self._deck.slot(start_slot).well(start_well)
        end = self._deck.slot(end_slot).well(end_well)
        start.transfer(volume, end)

    def transfer_group(self, *transfers):
        pass

    def distribute(self):
        pass

    def mix(self):
        pass

    def consolidate(self):
        pass


class MotorControlHandler(ProtocolHandler):

    _driver = None

    def set_driver(self, connection):
        self._driver = connection

    def transfer(self, start=None, end=None, volume=None, **kwargs):
        self.pickup_tip()
        self.move_volume(start, end, volume)
        self.dispose_tip()

    def move_volume(self, start, end, volume):
        self.move_to_well(start)
        self.move_to_well(end)
        """
        Full sequence; we're implementing it iteratively:
            self.move_to_well(start)
            self.depress_plunger(volume)
            self.move_into_well(start)
            self.release_plunger()
            self.move_to_well(end)
            self.move_into_well(end)
            self.blowout()
            self.move_to_well(end)
            self.release_plunger()
        """

    def pickup_tip(self):
        pass

    def lower_tip(self):
        pass

    def dispose_tip(self):
        pass

    def move_to_well(self, well):
        coords = self._context.get_coordinates(well)
        x, y, z = coords
        self._move_motors(x=x, y=y, z=z)

    def move_into_well(self, well):
        pass

    def depress_plunger(self, volume):
        pass

    def release_plunger(self):
        pass

    def blowout(self):
        pass

    def dispense(self):
        pass

    def _move_motors(self, **kwargs):
        self._driver.move(**kwargs)
