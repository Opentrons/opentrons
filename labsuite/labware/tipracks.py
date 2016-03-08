from labsuite.labware.grid import GridContainer, GridItem


class Tiprack(GridContainer):

    size = None

    rows = 12
    cols = 8

    _used = 0  # get_next_tip counter
    _tagged_tips = None  # Dict containing tags and offsets for tip reuse.

    """
    Taken from microplate specs.
    """
    spacing = 9
    a1_x = 14.38
    a1_y = 11.24

    def tip(self, position):
        return self.get_child(position)

    def set_tips_used(self, number):
        """
        Sets the number of used tips in the tiprack.
        """
        self._used = number - 1

    @property
    def tips_used(self):
        """
        Returns the number of tips used so far in this tiprack.
        """
        return self._used + 1

    def get_next_tip(self, tag=None):
        """
        Returns the next tip in the sequence. If a tag is passed, that tag
        will automatically be reused. (For scenarios in which the robot is
        capable of dropping a used tip back into the rack rather than
        disposing it.)
        """
        offset = self._used

        if tag:
            # Ensure tag map exists.
            if self._tagged_tips is None:
                self._tagged_tips = {}
            # Check for tag or create it.
            if tag not in self._tagged_tips:
                # Increment used tip for new tag.
                self._tagged_tips[tag] = offset
                self._used = self._used + 1
            else:
                # Reuse old tip.
                offset = self._tagged_tips[tag]
        else:
            self._used = self._used + 1  # Standard increment.

        return self.tip(self._position_in_sequence(offset))

    @classmethod
    def tip_offset(cls, used=0):
        """
        Returns the x, y, z offset for a tip position, incremented by the
        number of tips previously used.
        """
        return cls.coordinates(cls._position_in_sequence(used))


class Tiprack_P10(Tiprack):
    size = 'P10'


class Tiprack_P20(Tiprack):
    size = 'P20'


class Tiprack_P200(Tiprack):
    size = 'P200'


class Tiprack_P1000(Tiprack):
    size = 'P1000'
