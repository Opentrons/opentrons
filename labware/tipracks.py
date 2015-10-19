from .grid import GridContainer, GridItem


class TiprackSlot(GridItem):

    has_tip = True

    def get_tip(self):
        if self.has_tip:
            self.has_tip = False
            return True
        else:
            raise Exception(
                "No tip left in slot {} of tiprack"
                .format(self.position)
            )


class Tiprack(GridContainer):

    size = None

    rows = 12
    cols = 8

    """
    Taken from microplate specs.
    """
    spacing = 9
    a1_x = 14.38
    a1_y = 11.24

    child_class = TiprackSlot

    def slot(self, position):
        return self.get_child(position)


class Tiprack_P10(Tiprack):
    size = 'P10'


class Tiprack_P20(Tiprack):
    size = 'P20'


class Tiprack_P200(Tiprack):
    size = 'P200'


class Tiprack_P1000(Tiprack):
    size = 'P1000'
