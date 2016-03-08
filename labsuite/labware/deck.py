from labsuite.labware.grid import GridContainer
from labsuite.labware.containers import load_container

import copy


class Deck(GridContainer):

    rows = 3
    cols = 5

    def __init__(self, **kwargs):
        super(Deck, self).__init__()
        self.add_modules(**kwargs)

    def add_modules(self, **kwargs):
        for position in kwargs:
            self.add_module(position, kwargs[position])

    def add_module(self, position, mod):
        pos = self._normalize_position(position)
        if isinstance(mod, str):
            mod = load_container(mod)()
        if pos not in self._children:
            self._children[pos] = mod
            mod.position = position
        else:
            raise Exception(
                "Module already allocated to slot: {}/{}."
                .format(position.upper(), pos)
            )

    def slot(self, position):
        pos = self._normalize_position(position)
        if pos not in self._children:
            raise KeyError(
                "No deck module at slot {}/{}."
                .format(position.upper(), pos)
            )
        return self._children[pos]

    def configure(self, obj):
        self.calibrate(**obj['calibration'])

    def calibrate(self, **calibration):
        for pos in calibration:
            module = self.slot(pos)
            if not module:
                raise AttributeError("No module in slot {}.".format(pos))
            module.calibrate(**calibration[pos])

    def dump_calibration(self):
        obj = {}
        for pos in self._children:
            col, row = pos
            col = chr(ord('A') + col)
            row = row + 1
            key = "{}{}".format(col, row)
            obj[key] = {}
            data = copy.deepcopy(self._children[pos]._calibration or {})
            obj[key]['calibration'] = data
            name = self._children[pos].name
            if name:
                obj[key]['name'] = name
        return obj

    def load_calibration(self, data):
        for pos in data:
            Container = load_container(data[pos]['name'])
            self.add_module(pos, Container())
        self.calibrate(**data)

    def needs_calibration(self, side='A'):
        """
        Returns a list of all modules which still require calibration.
        """
