from opentrons_sdk.labware.grid import GridContainer, humanize_position
from opentrons_sdk.labware.containers import load_container


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
        """
        :param position: Slot location of module in OpenTrons deck
        :param mod: str or object representing the module
        :return: module object
        """
        pos = self._normalize_position(position)
        if isinstance(mod, str):
            mod = load_container(mod)()
        if pos not in self._children:
            self._children[pos] = mod
            mod.position = position
        else:
            raise KeyError(
                "Module already allocated to slot: {}/{}."
                .format(humanize_position(pos), pos)
            )
        return mod

    def find_module(self, **filters):
        for pos, mod in sorted(self._children.items()):
            match = True
            for k, v in filters.items():
                if getattr(mod, k, None) != filters[k]:
                    match = False
                    break
            if match:
                return mod

    def get_modules(self):
        return sorted(self._children.items())

    def slot(self, position):
        pos = self._normalize_position(position)
        if pos not in self._children:
            raise KeyError(
                "No deck module at slot {}/{}."
                .format(humanize_position(pos), pos)
            )
        return self._children[pos]
