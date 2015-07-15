class Pipette():

    channels = 1

    def __init__(self):
        pass

    def configure(self, stop=None, drop=None, volume=None, side=None):
        if stop:
            self.stop = stop
        if drop:
            self.drop = drop
        if volume:
            self.volume = volume
        if side:
            self.side = side

    def transfer(start, end):
        pass


class Pipette_P2(Pipette):
    size     = 'P2'
    min_vol  =   0.0
    max_vol  =   2


class Pipette_P10(Pipette):
    size     = 'P10'
    min_vol  =    0.5
    max_vol  =   10


class Pipette_P20(Pipette):
    size     = 'P20'
    min_vol  =    2
    max_vol  =   20


class Pipette_P200(Pipette):
    size     = 'P200'
    min_vol  =   20
    max_vol  =  200


class Pipette_P1000(Pipette):
    size     = 'P1000'
    min_vol  =  200
    max_vol  = 1000
