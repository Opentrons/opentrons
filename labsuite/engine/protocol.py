from labsuite.labware import containers
from labsuite.labware.grid import normalize_position


class Protocol():

    _ingredients = None  # { 'name': "A1:A1" }

    _deck = None  # { (0,0): container, (0,1): container }

    _instruments = None  # { 'A': instrument, 'B': instrument }

    _container_labels = None  # Aliases. { 'foo': (0,0), 'bar': (0,1) }

    # We bottle action-based calls and then unpack them later using
    # *args and **kwargs. Some normalization happens between protocol
    # formats.
    _actions = None  # []

    def __init__(self):
        self._ingredients = {}
        self._deck = {}
        self._container_labels = {}
        self._actions = []

    def add_container(self, name, slot, label=None):
        slot = normalize_position(slot)
        container = containers.load_container(name)()
        self._deck[slot] = container
        if (label):
            label = label.lower()
            self._container_labels[label] = slot

    def add_instrument(self, *args, **kwargs):
        pass

    def add_ingredient(self, name, location):
        pass

    def allocate(self, **kwargs):
        pass

    def transfer(self, start, end, ul=None, ml=None, 
                 blowout=True, touchtip=True):
        if ul:
            volume = ul
        else:
            volume = ml * 1000

        self._actions.append({
            'transfer': {
                'tool': 'p10',
                'volume': volume,
                'from': self._normalize_address(start),
                'to': self._normalize_address(end),
                'blowout': blowout,
                'touch-tip': touchtip
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
                'from': self._normalize_address(start),
                'to': self._normalize_address(end),
                'blowout': options['blowout'],
                'touch-tip': options['touchtip']
            })
        self._actions.append({
            'transfer_group': {
                'tool': 'p10',
                'transfers': transfers
            }
        })

    def distribute(self, ul=None, ml=None, start=None, end=None):
        pass

    def consolidate(self):
        pass

    def mix(self):
        pass

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
        like (0, 0) or ('Ingredients', 0).

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
