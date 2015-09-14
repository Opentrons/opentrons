from .grid import GridContainer, GridItem
from .liquids import LiquidContainer, LiquidWell


class Microplate(GridContainer, LiquidContainer):
    rows     =   8
    cols     =  12
    volume   = 100
    min_vol  =  50
    max_vol  =  90
    height   =  14.45
    length   = 127.76
    width    =  85.47
    diameter =   7.15
    depth    =   3.25
    a1_x     =  14.38
    a1_y     =  11.24
    spacing  =   9

    def well(self, position):
        return self.get_child(position)

    def calibrate(self, **kwargs):
        """
        Coordinates should represent the center and near-bottom of well
        A1 with the pipette tip in place.
        """
        super(Microplate, self).calibrate(**kwargs)


class Microplate_96(Microplate):
    pass


class Microplate_96_deepwell(Microplate_96):
    volume   = 400
    min_vol  =  50
    max_vol  = 380
    height   =  14.6
    depth    =  10.8
