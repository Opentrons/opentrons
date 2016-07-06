from labsuite.labware import containers, deck, pipettes
from labsuite.labware.grid import normalize_position
from labsuite.engine.context import Context
import labsuite.drivers.motor as motor_drivers
from labsuite.util.log import debug

import copy


class Protocol():

    _ingredients = None  # { 'name': "A1:A1" }

    _context = None  # Operational context (virtual robot).

    _instruments = None  # { 'A': instrument, 'B': instrument }

    _container_labels = None  # Aliases. { 'foo': (0,0), 'bar': (0,1) }

    _commands = None  # []

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

    def add_instrument(self, slot, name):
        self._context.add_instrument(slot, name)

    def add_ingredient(self, name, location):
        pass

    def allocate(self, **kwargs):
        pass

    def calibrate(self, *args, **kwargs):
        self._context.calibrate(*args, **kwargs)

    def calibrate_instrument(self, axis, top=None, blowout=None, droptip=None):
        self._context.calibrate_instrument(
            axis, top=top, blowout=blowout, droptip=droptip
        )

    def add_command(self, command, **kwargs):
        self._commands.append({command: kwargs})

    def transfer(self, start, end, ul=None, ml=None,
                 blowout=True, touchtip=True):
        if ul:
            volume = ul
        else:
            volume = ml * 1000
        self.add_command(
            'transfer',
            tool='p10',
            volume=volume,
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
            tool='p10',
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

    def _run(self, index):
        cur = self._commands[index]
        command = list(cur)[0]
        kwargs = cur[command]
        method = getattr(self._context, command)
        if not method:
            raise KeyError("Command not defined: " + command)
        method(**kwargs)
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
        handler = handler_class(self, self._context)
        self._handlers.append(handler)
        return handler

    def teardown(self):
        for h in self._handlers:
            h.teardown()


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

    def teardown(self):
        """
        Whatever cleanup you need to do after a protocol is does
        running.
        """
        pass

    def before_each(self):
        pass

    def after_each(self):
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
    _instruments = None  # Axis as keys; Pipette object as vals.

    def setup(self):
        self._deck = deck.Deck()
        self._instruments = {}

    def add_instrument(self, axis, name):
        # We only have pipettes now so this is pipette-specific.
        self._instruments[axis] = pipettes.load_instrument(name)

    def get_instrument(self, axis=None, volume=None):
        if axis:
            if axis not in self._instruments:
                raise KeyError(
                    "No instrument assigned to {} axis.".format(axis)
                )
            else:
                return self._instruments[axis]
        if volume:
            for k, i in self._instruments.items():
                if i.supports_volume(volume):
                    return i

        raise KeyError(
            "No instrument found to support a volume of {}µl."
            .format(volume)
        )

    def calibrate_instrument(self, axis, top=None, blowout=None, droptip=None):
        kwargs = {'top': top, 'blowout': blowout, 'droptip': droptip,
                  'axis': axis}
        self.get_instrument(axis=axis).calibrate(**kwargs)

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

    def get_tip_coordinates(self, size):
        """
        Returns the coordinates of the next available pipette tip for that
        particular size (ie, p10).
        """
        pass

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
