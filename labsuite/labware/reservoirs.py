from labsuite.labware.grid import GridContainer
from labsuite.labware.liquids import LiquidWell


class Reservoir(GridContainer):

    rows = 12
    cols = 1
    spacing = 1  # TODO: Look this up.
    min_vol = 500
    max_vol = 21 * 1000
    volume  = 21 * 1000
    length  = 127.76
    width   =  85.47

    child_class = LiquidWell

    def row(self, row):
        position = self._normalize_position('A{}'.format(row))
        return self.get_child(position)
