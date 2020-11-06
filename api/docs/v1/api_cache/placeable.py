class Placeable:
    """
    This class represents every item on the deck.

    It maintains the hierarchy and provides means to:
    * traverse
    * retrieve items by name
    * calculate coordinates in different reference systems

    It should never be directly created; it is created by the system during
    labware load and when accessing wells.
    """

    def __init__(self, parent=None, properties=None):
        """
        Initiaize placeable.

        :parent: is a parent :Placeable: or :None:
        :properties: is a :dict: that will be stored within
        self.placeable
        """
        pass

    def center(self, reference=None):
        """
        Returns (:py:class:`.Placeable`, :py:class:`.Vector`) tuple where
        the vector points to the center of the placeable, in ``x``, ``y``,
        and ``z``. This can be passed into any :py:class:`.Robot` or
        :py:class:`.Pipette` method ``location`` argument.

        If ``reference`` (a :py:class:`.Placeable`) is provided, the return
        value will be in that placeable's coordinate system.

        :param reference: An optional placeable for the vector to be relative
                          to.
        :returns: A tuple of the placeable and the offset. This can be passed
                  into any :py:class:`.Robot` or :py:class:`.Pipette` method
                  ``location`` argument.
        """
        pass

    def bottom(self, z=0, radius=0, degrees=0, reference=None):
        """
        Returns (:py:class:`.Placeable`, :py:class:`.Vector`) tuple where
        the vector points to the bottom of the placeable. This can be passed
        into any :py:class:`.Robot` or :py:class:`.Pipette` method
        ``location`` argument.

        If ``reference`` (a :py:class:`.Placeable`) is provided, the return
        value will be in that placeable's coordinate system.

        The ``radius`` and ``degrees`` arguments are interpreted as
        in :py:meth:`.from_center` (except that ``degrees`` is in degrees, not
        radians). They can be used to specify a further distance from the
        bottom center of the well; for instance, calling
        ``bottom(radius=0.5, degrees=180)`` will move half the radius in the
        180 degree direction from the center of the well.

        The ``z`` argument is a distance in mm to move in z from the bottom,
        and can be used to hover above the bottom. For instance, calling
        ``bottom(z=1)`` will move 1mm above the bottom.

        :param z: Absolute distance in mm to move  in ``z`` from the bottom.
                  Note that unlike the other arguments, this is a distance, not
                  a ratio.
        :param degrees: Direction in which to move ``radius`` from the bottom
                        center.
        :param radius: Ratio of the placeable's radius to move in the direction
                       specified by ``degrees`` from the bottom center.
        :param reference: An optional placeable for the vector to be relative
                          to.
        :returns: A tuple of the placeable and the offset. This can be passed
                  into any :py:class:`.Robot` or :py:class:`.Pipette` method
                  ``location`` argument.
        """
        pass

    def top(self, z=0, radius=0, degrees=0, reference=None):
        """
        Returns (:py:class:`.Placeable`, :py:class:`.Vector`) tuple where
        the vector points to the top of the placeable. This can be passed
        into any :py:class:`.Robot` or :py:class:`.Pipette` method
        ``location`` argument.

        If ``reference`` (a :py:class:`.Placeable`) is provided, the return
        value will be in that placeable's coordinate system.

        The ``radius`` and ``degrees`` arguments are interpreted as
        in :py:meth:`.from_center` (except that ``degrees`` is in degrees, not
        radians). They can be used to specify a further distance from the top
        center of the well; for instance, calling
        ``top(radius=0.5, degrees=180)`` will move half the radius in the 180
        degree direction from the center of the well.

        The ``z`` argument is a distance in mm to move in z from the top, and
        can be used to hover above or below the top. For instance, calling
        ``top(z=-1)`` will move 1mm below the top.

        :param z: Absolute distance in mm to move  in ``z`` from the top. Note
                  that unlike the other arguments, this is a distance, not a
                  ratio.
        :param degrees: Direction in which to move ``radius`` from the top
                        center.
        :param radius: Ratio of the placeable's radius to move in the direction
                       specified by ``degrees`` from the top center.
        :returns: A tuple of the placeable and the offset. This can be passed
                  into any :py:class:`.Robot` or :py:class:`.Pipette` method
                  ``location`` argument.
        """
        pass

    def from_center(self, x=None, y=None, z=None, r=None,
                    theta=None, h=None, reference=None):
        """
        Accepts a set of ratios for Cartesian or ratios/angle for Polar
        and returns :py:class:`.Vector` using ``reference`` as origin.

        Though both polar and cartesian arguments are accepted, only one
        set should be used at the same time, and the set selected should be
        entirely used. In addition, all variables in the set should be used.

        For instance, if you want to use cartesian coordinates, you must
        specify all of ``x``, ``y``, and ``z`` as numbers; if you want to
        use polar coordinates, you must specify all of ``theta``, ``r`` and
        ``h`` as numbers.

        While ``theta`` is an absolute angle in radians, the other values are
        actually ratios which are multiplied by the relevant dimensions of the
        placeable on which ``from_center`` is called. For instance, calling
        ``from_center(x=0.5, y=0.5, z=0.5)`` does not mean "500 micromenters
        from the center in each dimension", but "half the x size, half the y
        size, and half the z size from the center". Similarly,
        ``from_center(r=0.5, theta=3.14, h=0.5)`` means "half the radius
        dimension at 180 degrees, and half the height upwards".

        :param x: Ratio of the x dimension of the placeable to move from the
                  center.
        :param y: Ratio of the y dimension of the placeable to move from the
                  center.
        :param z: Ratio of the z dimension of the placeable to move from the
                  center.
        :param r: Ratio of the radius to move from the center.
        :param theta: Angle in radians at which to move the percentage of the
                      radius specified by ``r`` from the center.
        :param h: Percentage of the height to move up in z from the center.
        :param reference: If specified, an origin to add to the offset vector
                          specified by the other arguments.
        :returns: A vector from either the origin or the specified reference.
                  This can be passed into any :py:class:`.Robot` or
                  :py:class:`.Pipette` method ``location`` argument.
        """
        pass
