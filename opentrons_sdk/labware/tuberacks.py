from opentrons_sdk.labware.grid import GridContainer
from opentrons_sdk.labware.liquids import LiquidWell


class Tuberack(GridContainer):

    child_class = LiquidWell

    def tube(self, position):
        return self.get_child(position)
