from .grid import GridContainer
from .liquids import LiquidWell


class Tuberack(GridContainer):

    child_class = LiquidWell

    def tube(self, position):
        return self.get_child(position)
