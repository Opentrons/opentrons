from labsuite.labware import containers, deck
from labsuite.labware.grid import normalize_position
from labsuite.engine.context import Context

import copy


class Protocol():

    _ingredients = None  # { 'name': "A1:A1" }

    _context = None  # Operational context (virtual robot).

    _instruments = None  # { 'A': instrument, 'B': instrument }

    _container_labels = None  # Aliases. { 'foo': (0,0), 'bar': (0,1) }

    _commands = None  # []

    _command_index = 0  # Index of the running command.

    def __init__(self):
        self._ingredients = {}
        self._container_labels = {}
        self._commands = []
        self._context = ContextHandler(self)

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

    _deck = None

    def setup(self):
        self._deck = deck.Deck()

    def add_container(self, slot, container_name):
        self._deck.add_module(slot, container_name)

    def calibrate(self, slot, x=None, y=None, z=None):
        self._deck.calibrate(**{slot: {'x': x, 'y': y, 'z': z}})

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
