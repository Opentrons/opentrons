PLUNGER_POSITIONS = {
    'top': 18.5,
    'bottom': 2,
    'blow_out': 0,
    'drop_tip': -3.5
}

DROP_TIP_RELEASE_DISTANCE = 20
DEFAULT_DROP_TIP_SPEED = 5

DEFAULT_ASPIRATE_SPEED = 5
DEFAULT_DISPENSE_SPEED = 10
DEFAULT_BLOW_OUT_SPEED = 60

DEFAULT_TIP_PRESS_INCREMENT = 1
DEFAULT_TIP_PRESS_COUNT = 3

DEFAULT_TIP_PRESS_MM = 10
DEFAULT_PLUNGE_CURRENT = 0.1

DEFAULT_TIP_PICK_UP_SPEED = 30

SHAKE_OFF_TIPS_SPEED = 50
SHAKE_OFF_TIPS_DROP_DISTANCE = 2.25
SHAKE_OFF_TIPS_PICKUP_DISTANCE = 0.3


class NoTipAttachedError(RuntimeError):
    pass

class Pipette:
    """
    DIRECT USE OF THIS CLASS IS DEPRECATED -- this class should not be used
    directly. Its parameters, defaults, methods, and behaviors are subject to
    change without a major version release. Use the model-specific constructors
    available through ``from opentrons import instruments``.

    All model-specific instrument constructors are inheritors of this class.
    With any of those instances you can can:

    * Handle liquids with :meth:`aspirate`, :meth:`dispense`,
      :meth:`mix`, and :meth:`blow_out`
    * Handle tips with :meth:`pick_up_tip`, :meth:`drop_tip`,
      and :meth:`return_tip`
    * Calibrate this pipette's plunger positions
    * Calibrate the position of each :any:`Container` on deck

    Here are the typical steps of using the Pipette:

    * Instantiate a pipette with a maximum volume (uL)
      and a mount (`left` or `right`)
    * Design your protocol through the pipette's liquid-handling commands

    Methods in this class include assertions where needed to ensure that any
    action that requires a tip must be preceeded by `pick_up_tip`. For example:
    `mix`, `transfer`, `aspirate`, `blow_out`, and `drop_tip`.

    Parameters
    ----------
    mount : str
        The mount of the pipette's actuator on the Opentrons robot
        ('left' or 'right')
    trash_container : Container
        Sets the default location :meth:`drop_tip()` will put tips
        (Default: `fixed-trash`)
    tip_racks : list
        A list of Containers for this Pipette to track tips when calling
        :meth:`pick_up_tip` (Default: [])
    aspirate_flow_rate : int
        The speed (in ul/sec) the plunger will move while aspirating
        (Default: See Model Type)
    dispense_flow_rate : int
        The speed (in ul/sec) the plunger will move while dispensing
        (Default: See Model Type)

    Returns
    -------

    A new instance of :class:`Pipette`.

    Examples
    --------
    >>> from opentrons import instruments, labware, robot # doctest: +SKIP
    >>> robot.reset() # doctest: +SKIP
    >>> tip_rack_300ul = labware.load(
    ...     'GEB-tiprack-300ul', '1') # doctest: +SKIP
    >>> p300 = instruments.P300_Single(mount='left',
    ...     tip_racks=[tip_rack_300ul]) # doctest: +SKIP
    """

    def __init__(  # noqa: C901
            self,
            robot,
            model_offset=(0, 0, 0),
            mount=None,
            axis=None,
            mount_obj=None,
            model=None,
            name=None,
            ul_per_mm=None,
            channels=1,
            min_volume=0,
            max_volume=None,  # Set 300ul as default
            trash_container='',
            tip_racks=[],
            aspirate_speed=DEFAULT_ASPIRATE_SPEED,
            dispense_speed=DEFAULT_DISPENSE_SPEED,
            blow_out_speed=DEFAULT_BLOW_OUT_SPEED,
            aspirate_flow_rate=None,
            dispense_flow_rate=None,
            plunger_current=0.5,
            drop_tip_current=0.5,
            return_tip_height=None,
            drop_tip_speed=DEFAULT_DROP_TIP_SPEED,
            plunger_positions=PLUNGER_POSITIONS,
            pick_up_current=DEFAULT_PLUNGE_CURRENT,
            pick_up_distance=DEFAULT_TIP_PRESS_MM,
            pick_up_increment=DEFAULT_TIP_PRESS_INCREMENT,
            pick_up_presses=DEFAULT_TIP_PRESS_COUNT,
            pick_up_speed=DEFAULT_TIP_PICK_UP_SPEED,
            quirks=[],
            fallback_tip_length=51.7,
            blow_out_flow_rate=None,
            requested_as=None,
            pipette_id=None):
        pass

    def move_to(self, location, strategy=None):
        """
        Move this :any:`Pipette` to a :any:`Placeable` on the :any:`Deck`

        Notes
        -----
        Until obstacle-avoidance algorithms are in place,
        :any:`Robot` and :any:`Pipette` :meth:`move_to` use either an
        "arc" or "direct"

        Parameters
        ----------
        location : :any:`Placeable` or tuple(:any:`Placeable`, :any:`Vector`)
            The destination to arrive at

        strategy : "arc" or "direct"
            "arc" strategies (default) will pick the head up on Z axis, then
            over to the XY destination, then finally down to the Z destination.
            "direct" strategies will simply move in a straight line from
            the current position

        Returns
        -------

        This instance of :class:`Pipette`.
        """
        pass

    def aspirate(self, volume=None, location=None, rate=1.0):
        """
        Aspirate a volume of liquid (in microliters/uL) using this pipette
        from the specified location

        Notes
        -----
        If only a volume is passed, the pipette will aspirate
        from it's current position. If only a location is passed,
        `aspirate` will default to it's `max_volume`.

        The location may be a Well, or a specific position in relation to a
        Well, such as `Well.top()`. If a Well is specified without calling a
        a position method (such as .top or .bottom), this method will default
        to the bottom of the well.

        Parameters
        ----------
        volume : int or float
            The number of microliters to aspirate (Default: self.max_volume)

        location : :any:`Placeable` or tuple(:any:`Placeable`, :any:`Vector`)
            The :any:`Placeable` (:any:`Well`) to perform the aspirate.
            Can also be a tuple with first item :any:`Placeable`,
            second item relative :any:`Vector`

        rate : float
            Set plunger speed for this aspirate, where
            speed = rate * aspirate_speed (see :meth:`set_speed`)

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------

        >>> from opentrons import instruments, labware, robot # doctest: +SKIP
        >>> robot.reset() # doctest: +SKIP
        >>> plate = labware.load('96-flat', '2') # doctest: +SKIP
        >>> p300 = instruments.P300_Single(mount='right') # doctest: +SKIP
        >>> p300.pick_up_tip() # doctest: +SKIP
        # aspirate 50uL from a Well
        >>> p300.aspirate(50, plate[0]) # doctest: +SKIP
        # aspirate 50uL from the center of a well
        >>> p300.aspirate(50, plate[1].bottom()) # doctest: +SKIP
        >>> # aspirate 20uL in place, twice as fast
        >>> p300.aspirate(20, rate=2.0) # doctest: +SKIP
        >>> # aspirate the pipette's remaining volume (80uL) from a Well
        >>> p300.aspirate(plate[2]) # doctest: +SKIP
        """
        pass

    def dispense(self,
                 volume=None,
                 location=None,
                 rate=1.0):
        """
        Dispense a volume of liquid (in microliters/uL) using this pipette

        Notes
        -----
        If only a volume is passed, the pipette will dispense
        from it's current position. If only a location is passed,
        `dispense` will default to it's `current_volume`

        The location may be a Well, or a specific position in relation to a
        Well, such as `Well.top()`. If a Well is specified without calling a
        a position method (such as .top or .bottom), this method will default
        to the bottom of the well.

        Parameters
        ----------
        volume : int or float
            The number of microliters to dispense
            (Default: self.current_volume)
        location : :any:`Placeable` or tuple(:any:`Placeable`, :any:`Vector`)
            The :any:`Placeable` (:any:`Well`) to perform the dispense.
            Can also be a tuple with first item :any:`Placeable`,
            second item relative :any:`Vector`
        rate : float
            Set plunger speed for this dispense, where
            speed = rate * dispense_speed (see :meth:`set_speed`)

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------

        >>> from opentrons import instruments, labware, robot # doctest: +SKIP
        >>> robot.reset() # doctest: +SKIP
        >>> plate = labware.load('96-flat', '3') # doctest: +SKIP
        >>> p300 = instruments.P300_Single(mount='left') # doctest: +SKIP
        # fill the pipette with liquid (200uL)
        >>> p300.aspirate(plate[0]) # doctest: +SKIP
        # dispense 50uL to a Well
        >>> p300.dispense(50, plate[0]) # doctest: +SKIP
        # dispense 50uL to the center of a well
        >>> relative_vector = plate[1].center() # doctest: +SKIP
        >>> p300.dispense(50, (plate[1], relative_vector)) # doctest: +SKIP
        # dispense 20uL in place, at half the speed
        >>> p300.dispense(20, rate=0.5) # doctest: +SKIP
        # dispense the pipette's remaining volume (80uL) to a Well
        >>> p300.dispense(plate[2]) # doctest: +SKIP
        """
        pass

    def mix(self,
            repetitions=1,
            volume=None,
            location=None,
            rate=1.0):
        """
        Mix a volume of liquid (in microliters/uL) using this pipette

        Notes
        -----
        If no `location` is passed, the pipette will mix
        from it's current position. If no `volume` is passed,
        `mix` will default to it's `max_volume`

        Parameters
        ----------
        repetitions: int
            How many times the pipette should mix (Default: 1)

        volume : int or float
            The number of microliters to mix (Default: self.max_volume)

        location : :any:`Placeable` or tuple(:any:`Placeable`, :any:`Vector`)
            The :any:`Placeable` (:any:`Well`) to perform the mix.
            Can also be a tuple with first item :any:`Placeable`,
            second item relative :any:`Vector`

        rate : float
            Set plunger speed for this mix, where
            speed = rate * (aspirate_speed or dispense_speed)
            (see :meth:`set_speed`)

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------

        >>> from opentrons import instruments, labware, robot # doctest: +SKIP
        >>> robot.reset() # doctest: +SKIP
        >>> plate = labware.load('96-flat', '4') # doctest: +SKIP
        >>> p300 = instruments.P300_Single(mount='left') # doctest: +SKIP
        # mix 50uL in a Well, three times
        >>> p300.mix(3, 50, plate[0]) # doctest: +SKIP
        # mix 3x with the pipette's max volume, from current position
        >>> p300.mix(3) # doctest: +SKIP
        """
        pass

    def blow_out(self, location=None):
        """
        Force any remaining liquid to dispense, by moving
        this pipette's plunger to the calibrated `blow_out` position

        Notes
        -----
        If no `location` is passed, the pipette will blow_out
        from it's current position.

        Parameters
        ----------
        location : :any:`Placeable` or tuple(:any:`Placeable`, :any:`Vector`)
            The :any:`Placeable` (:any:`Well`) to perform the blow_out.
            Can also be a tuple with first item :any:`Placeable`,
            second item relative :any:`Vector`

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------

        >>> from opentrons import instruments, robot # doctest: +SKIP
        >>> robot.reset() # doctest: +SKIP
        >>> p300 = instruments.P300_Single(mount='left') # doctest: +SKIP
        >>> p300.aspirate(50).dispense().blow_out() # doctest: +SKIP
        """

    def touch_tip(self, location=None, radius=1.0, v_offset=-1.0, speed=60.0):
        """
        Touch the :any:`Pipette` tip to the sides of a well,
        with the intent of removing left-over droplets

        Notes
        -----
        If no `location` is passed, the pipette will touch_tip
        from it's current position.

        Parameters
        ----------
        location : :any:`Placeable`
            The :any:`Placeable` (:any:`Well`) to perform the touch_tip.

        radius : float
            Radius is a floating point describing the percentage of a well's
            radius. When radius=1.0, :any:`touch_tip()` will move to 100% of
            the wells radius. When radius=0.5, :any:`touch_tip()` will move to
            50% of the wells radius.
            Default: 1.0 (100%)

        speed: float
            The speed for touch tip motion, in mm/s.
            Default: 60.0 mm/s, Max: 80.0 mm/s, Min: 20.0 mm/s

        v_offset: float
            The offset in mm from the top of the well to touch tip.
            Default: -1.0 mm

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------

        >>> from opentrons import instruments, labware, robot # doctest: +SKIP
        >>> robot.reset() # doctest: +SKIP
        >>> plate = labware.load('96-flat', '8') # doctest: +SKIP
        >>> p300 = instruments.P300_Single(mount='left') # doctest: +SKIP
        >>> p300.aspirate(50, plate[0]) # doctest: +SKIP
        >>> p300.dispense(plate[1]).touch_tip() # doctest: +SKIP
        """
        pass

    def air_gap(self, volume=None, height=None):
        """
        Pull air into the :any:`Pipette` current tip

        Notes
        -----
        If no `location` is passed, the pipette will touch_tip
        from it's current position.

        Parameters
        ----------
        volume : number
            The amount in uL to aspirate air into the tube.
            (Default will use all remaining volume in tip)

        height : number
            The number of millimiters to move above the current Placeable
            to perform and air-gap aspirate
            (Default will be 10mm above current Placeable)

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------

        >>> from opentrons import instruments, robot # doctest: +SKIP
        >>> robot.reset() # doctest: +SKIP
        >>> p300 = instruments.P300_Single(mount='left') # doctest: +SKIP
        >>> p300.aspirate(50, plate[0]) # doctest: +SKIP
        >>> p300.air_gap(50) # doctest: +SKIP
        """
        pass

    def return_tip(self, home_after=True):
        """
        Drop the pipette's current tip to it's originating tip rack

        Notes
        -----
        This method requires one or more tip-rack :any:`Container`
        to be in this Pipette's `tip_racks` list (see :any:`Pipette`)

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------

        >>> from opentrons import instruments, labware, robot # doctest: +SKIP
        >>> robot.reset() # doctest: +SKIP
        >>> tiprack = labware.load('GEB-tiprack-300', '2') # doctest: +SKIP
        >>> p300 = instruments.P300_Single(mount='left',
        ...     tip_racks=[tiprack, tiprack2]) # doctest: +SKIP
        >>> p300.pick_up_tip() # doctest: +SKIP
        >>> p300.aspirate(50, plate[0]) # doctest: +SKIP
        >>> p300.dispense(plate[1]) # doctest: +SKIP
        >>> p300.return_tip() # doctest: +SKIP
        """
        pass

    def pick_up_tip(self, location=None, presses=None, increment=None):
        """
        Pick up a tip for the Pipette to run liquid-handling commands with

        Notes
        -----
        A tip can be manually set by passing a `location`. If no location
        is passed, the Pipette will pick up the next available tip in
        it's `tip_racks` list (see :any:`Pipette`)

        Parameters
        ----------
        location : :any:`Placeable` or tuple(:any:`Placeable`, :any:`Vector`)
            The :any:`Placeable` (:any:`Well`) to perform the pick_up_tip.
            Can also be a tuple with first item :any:`Placeable`,
            second item relative :any:`Vector`
        presses : :any:int
            The number of times to lower and then raise the pipette when
            picking up a tip, to ensure a good seal (0 [zero] will result in
            the pipette hovering over the tip but not picking it up--generally
            not desireable, but could be used for dry-run). Default: 3 presses
        increment: :int
            The additional distance to travel on each successive press (e.g.:
            if presses=3 and increment=1, then the first press will travel down
            into the tip by 3.5mm, the second by 4.5mm, and the third by 5.5mm.
            Default: 1mm

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------

        >>> from opentrons import instruments, labware, robot # doctest: +SKIP
        >>> robot.reset() # doctest: +SKIP
        >>> tiprack = labware.load('GEB-tiprack-300', '2') # doctest: +SKIP
        >>> p300 = instruments.P300_Single(mount='left',
        ...     tip_racks=[tiprack]) # doctest: +SKIP
        >>> p300.pick_up_tip(tiprack[0]) # doctest: +SKIP
        >>> p300.return_tip() # doctest: +SKIP
        # `pick_up_tip` will automatically go to tiprack[1]
        >>> p300.pick_up_tip() # doctest: +SKIP
        >>> p300.return_tip() # doctest: +SKIP
        """
        pass

    def drop_tip(self, location=None, home_after=True):
        """
        Drop the pipette's current tip

        Notes
        -----
        If no location is passed, the pipette defaults to its `trash_container`
        (see :any:`Pipette`)

        Parameters
        ----------
        location : :any:`Placeable` or tuple(:any:`Placeable`, :any:`Vector`)
            The :any:`Placeable` (:any:`Well`) to perform the drop_tip.
            Can also be a tuple with first item :any:`Placeable`,
            second item relative :any:`Vector`

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------

        >>> from opentrons import instruments, labware, robot # doctest: +SKIP
        >>> robot.reset() # doctest: +SKIP
        >>> tiprack = labware.load('opentrons_96_tiprack_300ul', 'C2') # doctest: +SKIP  # noqa E501
        >>> trash = labware.load('point', 'A3') # doctest: +SKIP
        >>> p300 = instruments.P300_Single(mount='left') # doctest: +SKIP
        >>> p300.pick_up_tip(tiprack[0]) # doctest: +SKIP
        # drops the tip in the fixed trash
        >>> p300.drop_tip() # doctest: +SKIP
        >>> p300.pick_up_tip(tiprack[1]) # doctest: +SKIP
        # drops the tip back at its tip rack
        >>> p300.drop_tip(tiprack[1]) # doctest: +SKIP
        """
        pass

    def home(self):
        """
        Home the pipette's plunger axis during a protocol run

        Notes
        -----
        `Pipette.home()` homes the `Robot`

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------

        >>> from opentrons import instruments, robot # doctest: +SKIP
        >>> robot.reset() # doctest: +SKIP
        >>> p300 = instruments.P300_Single(mount='right') # doctest: +SKIP
        >>> p300.home() # doctest: +SKIP
        """
        pass

    def distribute(self, volume, source, dest, *args, **kwargs):
        """
        Distribute will move a volume of liquid from a single of source
        to a list of target locations. See :any:`Transfer` for details
        and a full list of optional arguments.

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------

        >>> from opentrons import instruments, labware, robot # doctest: +SKIP
        >>> robot.reset() # doctest: +SKIP
        >>> plate = labware.load('96-flat', '3') # doctest: +SKIP
        >>> p300 = instruments.P300_Single(mount='left') # doctest: +SKIP
        >>> p300.distribute(50, plate[1], plate.cols[0]) # doctest: +SKIP
        """
        pass

    def consolidate(self, volume, source, dest, *args, **kwargs):
        """
        Consolidate will move a volume of liquid from a list of sources
        to a single target location. See :any:`Transfer` for details
        and a full list of optional arguments.

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------

        >>> from opentrons import instruments, labware, robot # doctest: +SKIP
        >>> robot.reset() # doctest: +SKIP
        >>> plate = labware.load('96-flat', 'A3') # doctest: +SKIP
        >>> p300 = instruments.P300_Single(mount='left') # doctest: +SKIP
        >>> p300.consolidate(50, plate.cols[0], plate[1]) # doctest: +SKIP
        """
        pass

    def transfer(self, volume, source, dest, **kwargs):
        """
        Transfer will move a volume of liquid from a source location(s)
        to a dest location(s). It is a higher-level command, incorporating
        other :any:`Pipette` commands, like :any:`aspirate` and
        :any:`dispense`, designed to make protocol writing easier at the
        cost of specificity.

        Parameters
        ----------
        volumes : number, list, or tuple
            The amount of volume to remove from each `sources` :any:`Placeable`
            and add to each `targets` :any:`Placeable`. If `volumes` is a list,
            each volume will be used for the sources/targets at the
            matching index. If `volumes` is a tuple with two elements,
            like `(20, 100)`, then a list of volumes will be generated with
            a linear gradient between the two volumes in the tuple.

        source : Placeable or list
            Single :any:`Placeable` or list of :any:`Placeable`\\ s, from where
            liquid will be :any:`aspirate`\\ d from.

        dest : Placeable or list
            Single :any:`Placeable` or list of :any:`Placeable`\\ s, where
            liquid will be :any:`dispense`\\ ed to.

        new_tip : str
            The number of clean tips this transfer command will use. If
            'never', no tips will be picked up nor dropped. If 'once', a
            single tip will be used for all cmds. If 'always', a new tip
            will be used for each transfer. Default is 'once'.

        trash : boolean
            If `True` (default behavior) and trash container has been attached
            to this `Pipette`, then the tip will be sent to the trash
            container.
            If `False`, then tips will be returned to their associated tiprack.

        touch_tip : boolean
            If `True`, a :any:`touch_tip` will occur following each
            :any:`aspirate` and :any:`dispense`. If set to `False` (default),
            no :any:`touch_tip` will occur.

        blow_out : boolean
            If `True`, a :any:`blow_out` will occur following each
            :any:`dispense`, but only if the pipette has no liquid left in it.
            If set to `False` (default), no :any:`blow_out` will occur.

        mix_before : tuple
            Specify the number of repetitions volume to mix, and a :any:`mix`
            will proceed each :any:`aspirate` during the transfer and dispense.
            The tuple's values is interpreted as (repetitions, volume).

        mix_after : tuple
            Specify the number of repetitions volume to mix, and a :any:`mix`
            will following each :any:`dispense` during the transfer or
            consolidate. The tuple's values is interpreted as
            (repetitions, volume).

        carryover : boolean
            If `True` (default), any `volumes` that exceed the maximum volume
            of this `Pipette` will be split into multiple smaller volumes.

        repeat : boolean
            (Only applicable to :any:`distribute` and :any:`consolidate`)If
            `True` (default), sequential :any:`aspirate` volumes will be
            combined into one tip for the purpose of saving time. If `False`,
            all volumes will be transferred seperately.

        gradient : lambda
            Function for calculated the curve used for gradient volumes.
            When `volumes` is a tuple of length 2, it's values are used
            to create a list of gradient volumes. The default curve for
            this gradient is linear (lambda x: x), however a method can
            be passed with the `gradient` keyword argument to create a
            custom curve.

        Returns
        -------

        This instance of :class:`Pipette`.

        Examples
        --------

        >>> from opentrons import instruments, labware, robot # doctest: +SKIP
        >>> robot.reset() # doctest: +SKIP
        >>> plate = labware.load('96-flat', '5') # doctest: +SKIP
        >>> p300 = instruments.P300_Single(mount='right') # doctest: +SKIP
        >>> p300.transfer(50, plate[0], plate[1]) # doctest: +SKIP
        """
        pass

    def delay(self, seconds=0, minutes=0):
        """
        Parameters
        ----------

        seconds: float
            The number of seconds to freeze in place.
        """
        pass

    def set_speed(self, aspirate=None, dispense=None, blow_out=None):
        """
        Set the speed (mm/second) the :any:`Pipette` plunger will move
        during :meth:`aspirate` and :meth:`dispense`

        Parameters
        ----------
        aspirate: int
            The speed in millimeters-per-second, at which the plunger will
            move while performing an aspirate

        dispense: int
            The speed in millimeters-per-second, at which the plunger will
            move while performing an dispense
        """
        pass

    def set_flow_rate(self, aspirate=None, dispense=None, blow_out=None):
        """
        Set the speed (uL/second) the :any:`Pipette` plunger will move
        during :meth:`aspirate` and :meth:`dispense`. The speed is set using
        nominal max volumes for any given pipette model.

        Parameters
        ----------
        aspirate: int
            The speed in microliters-per-second, at which the plunger will
            move while performing an aspirate

        dispense: int
            The speed in microliters-per-second, at which the plunger will
            move while performing an dispense
        """
        pass
