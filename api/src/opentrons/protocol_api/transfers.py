import enum
from typing import (Any, Dict, List, Optional, Union, NamedTuple,
                    Callable, Generator, Iterator, Tuple,
                    TYPE_CHECKING, TypeVar)
from .labware import Well
from opentrons import types
from opentrons.protocols.types import APIVersion

if TYPE_CHECKING:
    from .contexts import InstrumentContext  # noqa (F501)
    from .dev_types import Dictable  # noqa(F501)


class MixStrategy(enum.Enum):
    BOTH = enum.auto()
    BEFORE = enum.auto()
    AFTER = enum.auto()
    NEVER = enum.auto()


class DropTipStrategy(enum.Enum):
    TRASH = enum.auto()
    RETURN = enum.auto()


class TouchTipStrategy(enum.Enum):
    NEVER = enum.auto()
    ALWAYS = enum.auto()


class BlowOutStrategy(enum.Enum):
    NONE = enum.auto()
    TRASH = enum.auto()
    DEST_IF_EMPTY = enum.auto()
    CUSTOM_LOCATION = enum.auto()


class TransferMode(enum.Enum):
    DISTRIBUTE = enum.auto()
    CONSOLIDATE = enum.auto()
    TRANSFER = enum.auto()


class Transfer(NamedTuple):
    """
    Options pertaining to behavior of the transfer.

    """

    new_tip: types.TransferTipPolicy = types.TransferTipPolicy.ONCE
    air_gap: float = 0
    carryover: bool = True
    gradient_function: Optional[Callable[[float], float]] = None
    disposal_volume: float = 0
    mix_strategy: MixStrategy = MixStrategy.NEVER
    drop_tip_strategy: DropTipStrategy = DropTipStrategy.TRASH
    blow_out_strategy: BlowOutStrategy = BlowOutStrategy.NONE
    touch_tip_strategy: TouchTipStrategy = TouchTipStrategy.NEVER


Transfer.new_tip.__doc__ = """
    Control when or if to pick up tip during a transfer

    :py:attr:`types.TransferTipPolicy.ALWAYS`
        Drop and pick up a new tip after each dispense.

    :py:attr:`types.TransferTipPolicy.ONCE`
        Pick up tip at the beginning of the transfer and use it
        throughout the transfer. This would speed up the transfer.

    :py:attr:`types.TransferTipPolicy.NEVER`
        Do not ever pick up or drop tip. The protocol should explicitly
        pick up a tip before transfer and drop it afterwards.

    To customize where to drop tip, see :py:attr:`.drop_tip_strategy`.
    To customize the behavior of pickup tip, see
    :py:attr:`.TransferOptions.pick_up_tip`.
    """

Transfer.air_gap.__doc__ = """
    Controls the volume (in uL) of air gap aspirated when moving to
    dispense.

    Adding an air gap would slow down a transfer since less liquid will
    now fit in the pipette but it prevents the loss of liquid while
    moving between wells.
    """

Transfer.carryover.__doc__ = """
    Controls whether volumes larger than pipette's max volume will be
    split into smaller volumes.
    """

Transfer.gradient_function.__doc__ = """
    Specify a nonlinear gradient for volumes.

    This should be a function that takes a single float between 0 and 1
    and returns a single float between 0 and 1. This function is used
    to determine the path the transfer takes between the volume
    gradient minimum and maximum if the transfer volume is specified as
    a gradient. For instance, specifying the function as

    .. code-block:: python

        def gradient(a):
            if a > 0.5:
                return 1.0
            else:
                return 0.0

    would transfer the minimum volume of the gradient to the first half
    of the target wells, and the maximum to the other half.
    """

Transfer.disposal_volume.__doc__ = """
    The amount of liquid (in uL) to aspirate as a buffer.

    The remaining buffer will be blown out into the location specified
    by :py:attr:`.blow_out_strategy`.

    This is useful to avoid under-pipetting but can waste reagent and
    slow down transfer.
    """

Transfer.mix_strategy.__doc__ = """
    If and when to mix during a transfer.

    :py:attr:`MixStrategy.NEVER`
        Do not ever perform a mix during the transfer.

    :py:attr:`MixStrategy.BEFORE`
        Mix before each aspirate.

    :py:attr:`MixStrategy.AFTER`
        Mix after each dispense.

    :py:attr:`MixStrategy.BOTH`
        Mix before each aspirate and after each dispense.

    To customize the mix behavior, see :py:attr:`.TransferOptions.mix`
    """

Transfer.drop_tip_strategy.__doc__ = """
    Specifies the location to drop tip into.

    :py:attr:`DropTipStrategy.TRASH`
        Drop the tip into the trash container.

    :py:attr:`DropTipStrategy.RETURN`
        Return the tip to tiprack.
    """

Transfer.blow_out_strategy.__doc__ = """
    Specifies the location to blow out the liquid in the pipette to.

    :py:attr:`BlowOutStrategy.TRASH`
        Blow out to trash container.

    :py:attr:`BlowOutStrategy.DEST_IF_EMPTY`
        If the volume in the current tip is 0 (expected), then blow out
        to the destination well in order to dispense any leftover
        liquid.

    :py:attr:`BlowOutStrategy.CUSTOM_LOCATION`
        If using any other location to blow out to. Specify the location in
        :py:attr:`.TransferOptions.blow_out`.
    """

Transfer.touch_tip_strategy.__doc__ = """
    Controls whether to touch tip during the transfer

    This helps in getting rid of any droplets clinging to the pipette
    tip at the cost of slowing down the transfer.

    :py:attr:`TouchTipStrategy.NEVER`
        Do not touch tip ever during the transfer.

    :py:attr:`TouchTipStrategy.ALWAYS`
        Touch tip after each aspirate.

    To customize the behavior of touch tips, see
    :py:attr:`.TransferOptions.touch_tip`.
    """


class PickUpTipOpts(NamedTuple):
    """
    Options to customize :py:attr:`.Transfer.new_tip`.

    These options will be passed to
    :py:meth:`InstrumentContext.pick_up_tip` when it is called during
    the transfer.
    """
    location: Optional[types.Location] = None
    presses: Optional[int] = None
    increment: Optional[int] = None


PickUpTipOpts.location.__doc__ = ':py:class:`types.Location`'
PickUpTipOpts.presses.__doc__ = ':py:class:`int`'
PickUpTipOpts.increment.__doc__ = ':py:class:`int`'


class MixOpts(NamedTuple):
    """
    Options to customize behavior of mix.

    These options will be passed to
    :py:meth:`InstrumentContext.mix` when it is called during the
    transfer.
    """

    repetitions: Optional[int] = None
    volume: Optional[float] = None
    rate: Optional[float] = None


MixOpts.repetitions.__doc__ = ':py:class:`int`'
MixOpts.volume.__doc__ = ':py:class:`float`'
MixOpts.rate.__doc__ = ':py:class:`float`'


class Mix(NamedTuple):
    """
    Options to control mix behavior before aspirate and after dispense.
    """
    mix_before: MixOpts = MixOpts()
    mix_after: MixOpts = MixOpts()


Mix.mix_before.__doc__ = """
    Options applied to mix before aspirate.
    See :py:class:`.Mix.MixOpts`.
    """

Mix.mix_after.__doc__ = """
    Options applied to mix after dispense. See :py:class:`.Mix.MixOpts`.
    """


class BlowOutOpts(NamedTuple):
    """
    Location where to blow out instead of the trash.

    This location will be passed to :py:meth:`InstrumentContext.blow_out`
    when called during the transfer
    """
    location: Optional[Union[types.Location, Well]] = None


BlowOutOpts.location.__doc__ = ':py:class:`types.Location`'


class TouchTipOpts(NamedTuple):
    """
    Options to customize touch tip.

    These options will be passed to
    :py:meth:`InstrumentContext.touch_tip` when called during the
    transfer.
    """
    radius: Optional[float] = None
    v_offset: Optional[float] = None
    speed: Optional[float] = None


TouchTipOpts.radius.__doc__ = ':py:class:`float`'
TouchTipOpts.v_offset.__doc__ = ':py:class:`float`'
TouchTipOpts.speed.__doc__ = ':py:class:`float`'


class AspirateOpts(NamedTuple):
    """
    Option to customize aspirate rate.

    This option will be passed to :py:meth:`InstrumentContext.aspirate`
    when called during the transfer.
    """
    rate: Optional[float] = 1.0


AspirateOpts.rate.__doc__ = ':py:class:`float`'


class DispenseOpts(NamedTuple):
    """
    Option to customize dispense rate.

    This option will be passed to :py:meth:`InstrumentContext.dispense`
    when called during the transfer.
    """
    rate: Optional[float] = 1.0


DispenseOpts.rate.__doc__ = ':py:class:`float`'


class TransferOptions(NamedTuple):
    """
    All available options for a transfer, distribute or consolidate function
    """
    transfer: Transfer = Transfer()
    pick_up_tip: PickUpTipOpts = PickUpTipOpts()
    mix: Mix = Mix()
    blow_out: BlowOutOpts = BlowOutOpts()
    touch_tip: TouchTipOpts = TouchTipOpts()
    aspirate: AspirateOpts = AspirateOpts()
    dispense: DispenseOpts = DispenseOpts()


TransferOptions.transfer.__doc__ = """
    Options pertaining to behavior of the transfer.

    For instance you can control how frequently to get a new tip using
    :py:attr:`.Transfer.new_tip`. For documentation of all transfer options
    see :py:class:`.Transfer`.
    """

TransferOptions.pick_up_tip.__doc__ = """
    Options used when picking up a tip during transfer.
    See :py:class:`.PickUpTipOpts`.
    """

TransferOptions.mix.__doc__ = """
    Options to control mix behavior before aspirate and after dispense.
    See :py:class:`.Mix`.
    """

TransferOptions.blow_out.__doc__ = """
    Option to specify custom location for blow out. See
    :py:class:`.BlowOutOpts`.
    """

TransferOptions.touch_tip.__doc__ = """
    Options to customize touch tip. See
    :py:class:`.TouchTipOpts`.
    """

TransferOptions.aspirate.__doc__ = """
    Option to customize aspirate rate. See
    :py:class:`.AspirateOpts`.
    """

TransferOptions.dispense.__doc__ = """
    Option to customize dispense rate. See
    :py:class:`.DispenseOpts`.
    """


class TransferPlan:
    """ Calculate and carry state for an arbitrary transfer

    This class encapsulates the logic around planning an M:N transfer.

    It handles calculations based on pipette channels, tip management, and all
    the various little commands that can be involved in a transfer. It can be
    iterated to resolve methods to call to execute the plan.
    """
    def __init__(self,
                 volume,
                 sources,
                 dests,
                 instr: 'InstrumentContext',
                 max_volume: float,
                 api_version: APIVersion,
                 mode: Optional[str] = None,
                 options: Optional[TransferOptions] = None
                 ) -> None:
        """ Build the transfer plan.

        This method initializes the object and does the work of preparing the
        transfer plan. Its arguments are as those of
        :py:meth:`.InstrumentContext.transfer`.
        """
        self._instr = instr
        self._api_version = api_version
        # Convert sources & dests into proper format
        # CASES:
        # i. if using multi-channel pipette,
        # and the source or target is a row/column of Wells (i.e list of Wells)
        # then avoid iterating through its Wells.
        # ii. if using single channel pipettes, flatten a multi-dimensional
        # list of Wells into a 1 dimensional list of Wells
        if self._instr.hw_pipette['channels'] > 1:
            sources, dests = self._multichannel_transfer(sources, dests)
        else:
            if isinstance(sources, List) and isinstance(sources[0], List):
                # Source is a List[List[Well]]
                sources = [well for well_list in sources for well in well_list]
            elif isinstance(sources, Well)\
                    or isinstance(sources, types.Location):
                sources = [sources]
            if isinstance(dests, List) and isinstance(dests[0], List):
                # Dest is a List[List[Well]]
                dests = [well for well_list in dests for well in well_list]
            elif isinstance(dests, Well) or isinstance(dests, types.Location):
                dests = [dests]

        total_xfers = max(len(sources), len(dests))

        self._volumes = self._create_volume_list(volume, total_xfers)
        self._sources = sources
        self._dests = dests
        self._options = options or TransferOptions()
        self._strategy = self._options.transfer
        self._tip_opts = self._options.pick_up_tip
        self._blow_opts = self._options.blow_out
        self._touch_tip_opts = self._options.touch_tip
        self._mix_before_opts = self._options.mix.mix_before
        self._mix_after_opts = self._options.mix.mix_after
        self._max_volume = max_volume

        if not mode:
            if len(sources) < len(dests):
                self._mode = TransferMode.DISTRIBUTE
            elif len(sources) > len(dests):
                self._mode = TransferMode.CONSOLIDATE
            else:
                self._mode = TransferMode.TRANSFER
        else:
            self._mode = TransferMode[mode.upper()]

    def __iter__(self):
        if self._strategy.new_tip == types.TransferTipPolicy.ONCE:
            yield self._format_dict('pick_up_tip', kwargs=self._tip_opts)
        yield from {TransferMode.CONSOLIDATE: self._plan_consolidate,
                    TransferMode.DISTRIBUTE: self._plan_distribute,
                    TransferMode.TRANSFER: self._plan_transfer}[self._mode]()
        if self._strategy.new_tip == types.TransferTipPolicy.ONCE:
            if self._strategy.drop_tip_strategy == DropTipStrategy.RETURN:
                yield self._format_dict('return_tip')
            else:
                yield self._format_dict('drop_tip')

    def _plan_transfer(self):
        """
        * **Source/ Dest:** Multiple sources to multiple destinations.
                            Src & dest should be equal length

        * **Volume:** Single volume or List of volumes is acceptable. This list
                      should be same length as sources/destinations

        * **Behavior with transfer options:**

            - New_tip: can be either NEVER or ONCE or ALWAYS
            - Air_gap: if specified, will be performed after every aspirate
            - Blow_out: can be performed after each dispense (after mix, before
                        touch_tip) at the location specified. If there is
                        liquid present in the tip (as in the case of nonzero
                        disposal volume), blow_out will be performed at either
                        user-defined location or (default) trash.
                        If no liquid is supposed to be present in the tip after
                        dispense, blow_out will be performed at dispense well
                        location (if blow out strategy is DEST_IF_EMPTY)
            - Touch_tip: can be performed after each aspirate and/or after
                         each dispense
            - Mix: can be performed before aspirate and/or after dispense
                   if there is no disposal volume (i.e. can be performed
                   only when the tip is supposed to be empty)

            Considering all options, the sequence of actions is:
            *New Tip -> Mix -> Aspirate (with disposal volume) -> Air gap ->
            -> Touch tip -> Dispense air gap -> Dispense -> Mix if empty ->
            -> Blow out -> Touch tip -> Drop tip*
        """
        # reform source target lists
        sources, dests = self._extend_source_target_lists(
            self._sources, self._dests)
        plan_iter = self._expand_for_volume_constraints(
            self._volumes, zip(sources, dests),
            self._instr.max_volume
            - self._strategy.disposal_volume
            - self._strategy.air_gap)
        for step_vol, (src, dest) in plan_iter:
            if self._strategy.new_tip == types.TransferTipPolicy.ALWAYS:
                yield self._format_dict('pick_up_tip', kwargs=self._tip_opts)
            max_vol = self._max_volume - \
                self._strategy.disposal_volume - self._strategy.air_gap
            xferred_vol = 0.0
            while xferred_vol < step_vol:
                # TODO: account for unequal length sources, dests
                # TODO: ensure last transfer is > min_vol
                vol = min(max_vol, step_vol - xferred_vol)
                yield from self._aspirate_actions(vol, src)
                yield from self._dispense_actions(vol, dest)
                xferred_vol += vol
            yield from self._new_tip_action()

    @staticmethod
    def _extend_source_target_lists(
            sources: List[Union[Well, types.Location]],
            targets: List[Union[Well, types.Location]]):
        """Extend source or target list to match the length of the other
        """
        if len(sources) < len(targets):
            if len(targets) % len(sources) != 0:
                raise ValueError(
                    'Source and destination lists must be divisible')
            sources = [source for source in sources
                       for i in range(int(len(targets)/len(sources)))]
        elif len(sources) > len(targets):
            if len(sources) % len(targets) != 0:
                raise ValueError(
                    'Source and destination lists must be divisible')
            targets = [target for target in targets
                       for i in range(int(len(sources)/len(targets)))]
        return sources, targets

    def _plan_distribute(self):
        """
        * **Source/ Dest:** One source to many destinations
        * **Volume:** Single volume or List of volumes is acceptable. This list
                      should be same length as destinations
        * **Behavior with transfer options:**

            - New_tip: can be either NEVER or ONCE
                       (ALWAYS will fallback to ONCE)
            - Air_gap: if specified, will be performed after every aspirate and
                       also in-between dispenses (to keep air gap while moving
                       between wells)
            - Blow_out: can be performed at the end of distribute (after mix,
                        before touch_tip) at the location specified. If there
                        is liquid present in the tip, blow_out will be
                        performed at either user-defined location or (default)
                        trash. If no liquid is supposed to be present in the
                        tip at the end of distribute, blow_out will be
                        performed at the last well the liquid was dispensed to
                        (if strategy is DEST_IF_EMPTY)
            - Touch_tip: can be performed after each aspirate and/or after
                         every dispense
            - Mix: can be performed before aspirate and/or after the last
                   dispense if there is no disposal volume (i.e. can be
                   performed only when the tip is supposed to be empty)

            Considering all options, the sequence of actions is:

            1. Going from source to dest1:
               *New Tip -> Mix -> Aspirate (with disposal volume) -> Air gap ->
               -> Touch tip -> Dispense air gap -> Dispense -> Mix if empty ->
               -> Blow out -> Touch tip -> Drop tip*
            2. Going from destn to destn+1:
               *.. Dispense air gap -> Dispense -> Touch tip -> Air gap ->
               .. Dispense air gap -> ...*

        """
        # TODO: decide whether default disposal vol for distribute should be
        # pipette min_vol or should we leave it to being 0 by default and
        # recommend users to specify a disposal vol when using distribute.
        # First method keeps distribute consistent with current behavior while
        # the other maintains consistency in default behaviors of all functions
        plan_iter = self._expand_for_volume_constraints(
            self._volumes, self._dests,
            self._instr.max_volume
            - self._strategy.disposal_volume
            - self._strategy.air_gap)

        done = False
        current_xfer = next(plan_iter)
        if self._strategy.new_tip == types.TransferTipPolicy.ALWAYS:
            yield self._format_dict('pick_up_tip', kwargs=self._tip_opts)
        while not done:
            asp_grouped: List[Tuple[float, Well]] = []
            try:
                while (sum(a[0] for a in asp_grouped) +
                       self._strategy.disposal_volume +
                       self._strategy.air_gap +
                       current_xfer[0]) <= self._max_volume:
                    asp_grouped.append(current_xfer)
                    current_xfer = next(plan_iter)
            except StopIteration:
                done = True
            yield from self._aspirate_actions(sum(a[0] for a in asp_grouped) +
                                              self._strategy.disposal_volume,
                                              self._sources[0])
            for step in asp_grouped:
                yield from self._dispense_actions(step[0], step[1],
                                                  step is not asp_grouped[-1])
        yield from self._new_tip_action()

    Target = TypeVar('Target')
    @staticmethod  # noqa(E301)
    def _expand_for_volume_constraints(
            volumes: Iterator[float],
            targets: Iterator[Target],
            max_volume: float)\
            -> Generator[Tuple[float, 'Target'], None, None]:
        """ Split a sequence of proposed transfers if necessary to keep each
        transfer under the given max volume.
        """
        for volume, target in zip(volumes, targets):
            while volume > max_volume * 2:
                yield max_volume, target
                volume -= max_volume

            if volume > max_volume:
                volume /= 2
                yield volume, target
            yield volume, target

    def _plan_consolidate(self):
        """
        * **Source/ Dest:** Many sources to one destination
        * **Volume:** Single volume or List of volumes is acceptable. This list
                      should be same length as sources
        * **Behavior with transfer options:**

            - New_tip: can be either NEVER or ONCE
                      (ALWAYS will fallback to ONCE)
            - Air_gap: if specified, will be performed after every aspirate
                       so that the aspirated liquids do not mix inside the tip.
                       The air gap will be dispensed while dispensing the
                       liquid into the destination well.
            - Blow_out: can be performed after a dispense (after mix,
                        before touch_tip) at the location specified. If there
                        is liquid present in the tip (which shouldn't happen
                        since consolidate doesn't take a disposal vol, yet),
                        blow_out will be performed at either user-defined
                        location or (default) trash.
                        If no liquid is supposed to be present in the tip after
                        dispense, blow_out will be performed at dispense well
                        loc (if blow out strategy is DEST_IF_EMPTY)
            - Touch_tip: can be performed after each aspirate and/or after
                         dispense
            - Mix: can be performed before the first aspirate and/or after
                   dispense if there is no disposal volume (i.e. can be
                   performed only when the tip is supposed to be empty)

            Considering all options, the sequence of actions is:
            1. Going from source to dest1:
               *New Tip -> Mix -> Aspirate (with disposal volume?) -> Air gap
               -> Touch tip -> Dispense air gap -> Dispense -> Mix if empty ->
               -> Blow out -> Touch tip -> Drop tip*
            2. Going from source(n) to source(n+1):
               *.. Aspirate -> Air gap -> Touch tip ->..
               .. Aspirate -> .....*
        """
        plan_iter = self._expand_for_volume_constraints(
            self._volumes, self._sources, self._instr.max_volume)
        current_xfer = next(plan_iter)
        if self._strategy.new_tip == types.TransferTipPolicy.ALWAYS:
            yield self._format_dict('pick_up_tip', kwargs=self._tip_opts)
        done = False
        while not done:
            asp_grouped: List[Tuple[float, Well]] = []
            try:
                while (sum([a[0] for a in asp_grouped]) +
                       self._strategy.disposal_volume +
                       self._strategy.air_gap * len(asp_grouped) +
                       current_xfer[0]) <= self._max_volume:
                    asp_grouped.append(current_xfer)
                    current_xfer = next(plan_iter)
            except StopIteration:
                done = True
            if not asp_grouped:
                break
            # Q: What accounts as disposal volume in a consolidate action?
            # yield self._format_dict('aspirate',
            #                         self._strategy.disposal_volume, loc)
            for step in asp_grouped:
                yield from self._aspirate_actions(step[0], step[1])
            yield from self._dispense_actions(
                sum([a[0] + self._strategy.air_gap for a in asp_grouped])
                - self._strategy.air_gap,
                self._dests[0])
        yield from self._new_tip_action()

    def _aspirate_actions(self, vol, loc):
        yield from self._before_aspirate(loc)
        yield self._format_dict('aspirate',
                                [vol, loc, self._options.aspirate.rate])
        yield from self._after_aspirate()

    def _dispense_actions(self, vol, loc, is_disp_next=False):
        if self._strategy.air_gap:
            vol += self._strategy.air_gap
        yield self._format_dict('dispense',
                                [vol, loc, self._options.dispense.rate])
        yield from self._after_dispense(loc, is_disp_next)

    def _before_aspirate(self, loc):
        if self._strategy.mix_strategy == MixStrategy.BEFORE or \
                self._strategy.mix_strategy == MixStrategy.BOTH:
            if self._instr.current_volume == 0:
                mix_before_opts = self._mix_before_opts._asdict()
                mix_before_opts['location'] = loc
                yield self._format_dict(
                    'mix', kwargs=mix_before_opts)

    def _after_aspirate(self):
        if self._strategy.air_gap:
            yield self._format_dict('air_gap', [self._strategy.air_gap])
        if self._strategy.touch_tip_strategy == TouchTipStrategy.ALWAYS:
            yield self._format_dict('touch_tip', kwargs=self._touch_tip_opts)

    def _after_dispense(self, loc, is_disp_next=False):  # noqa(C901)
        # This sequence of actions is subject to change
        if not is_disp_next:
            # If the next command is an aspirate, we are switching
            # between aspirate and dispense.
            if self._instr.current_volume == 0:
                # If we're empty, then this is when after mixes come into play
                if self._strategy.mix_strategy == MixStrategy.AFTER or \
                        self._strategy.mix_strategy == MixStrategy.BOTH:
                    mix_after_opts = self._mix_after_opts._asdict()
                    mix_after_opts['location'] = loc
                    yield self._format_dict('mix', kwargs=mix_after_opts)
                if self._strategy.blow_out_strategy \
                   == BlowOutStrategy.DEST_IF_EMPTY:
                    yield self._format_dict('blow_out', [loc])
            # If we're not empty but we're about to aspirate, we need a
            # blowout.
            if self._strategy.touch_tip_strategy == TouchTipStrategy.ALWAYS:
                yield self._format_dict('touch_tip',
                                        kwargs=self._touch_tip_opts)

            if self._strategy.blow_out_strategy == BlowOutStrategy.TRASH:
                yield self._format_dict('blow_out', [
                    self._instr.trash_container.wells()[0]])
            elif self._strategy.blow_out_strategy == \
                    BlowOutStrategy.CUSTOM_LOCATION:
                yield self._format_dict('blow_out', kwargs=self._blow_opts)
            elif self._strategy.disposal_volume:
                yield self._format_dict('blow_out', [
                    self._instr.trash_container.wells()[0]])
        else:
            # Used by distribute
            if self._strategy.air_gap:
                yield self._format_dict('air_gap', [self._strategy.air_gap])
            if self._strategy.touch_tip_strategy == TouchTipStrategy.ALWAYS:
                yield self._format_dict('touch_tip',
                                        kwargs=self._touch_tip_opts)

    def _new_tip_action(self):
        if self._strategy.new_tip == types.TransferTipPolicy.ALWAYS:
            if self._strategy.drop_tip_strategy == DropTipStrategy.RETURN:
                yield self._format_dict('return_tip')
            else:
                yield self._format_dict('drop_tip')

    def _format_dict(self, method: str,
                     args: List = None,
                     kwargs: Union['Dictable', Dict[str, Any]] = None):
        if kwargs:
            if isinstance(kwargs, Dict):
                params = {key: val for key, val in kwargs.items() if val}
            else:
                params = {key: val
                          for key, val in kwargs._asdict().items() if val}
        else:
            params = {}
        if not args:
            args = []
        return {'method': method, 'args': args, 'kwargs': params}

    def _create_volume_list(self, volume, total_xfers):
        if isinstance(volume, (float, int)):
            return [volume] * total_xfers
        elif isinstance(volume, tuple):
            return self._create_volume_gradient(
                volume[0], volume[-1], total_xfers,
                self._strategy.gradient_function)
        else:
            if not isinstance(volume, List):
                raise TypeError("Volume expected as a number or List or"
                                " tuple but got {}".format(volume))
            elif not len(volume) == total_xfers:
                raise RuntimeError("List of volumes should be equal to number "
                                   "of transfers")
            return volume

    def _create_volume_gradient(self, min_v, max_v, total, gradient=None):

        diff_vol = max_v - min_v

        def _map_volume(i):
            nonlocal diff_vol, total
            rel_x = i / (total - 1)
            rel_y = gradient(rel_x) if gradient else rel_x
            return (rel_y * diff_vol) + min_v

        return [_map_volume(i) for i in range(total)]

    def _check_valid_well_list(self, well_list, id, old_well_list):
        if self._api_version >= APIVersion(2, 2) and len(well_list) < 1:
            raise RuntimeError(
                (f'Invalid {id} for multichannel transfer: {old_well_list}. '
                'The multichannel can only access rows 1 and 2 of 384-well '
                'plates. If this is a valid 384-well plate, try using API '
                'Version 2.2 or greater.'))

    def _multichannel_transfer(self, s, d):
        # TODO: add a check for container being multi-channel compatible?
        # Helper function for multi-channel use-case
        assert isinstance(s, Well) or isinstance(s, types.Location) or \
               (isinstance(s, List) and isinstance(s[0], Well)) or \
               (isinstance(s, List) and isinstance(s[0], List)) or \
               (isinstance(s, List) and isinstance(s[0], types.Location)), \
               'Source should be a Well or List[Well] but is {}'.format(s)
        assert isinstance(d, Well) or isinstance(d, types.Location) or \
            (isinstance(d, List) and isinstance(d[0], Well)) or \
            (isinstance(d, List) and isinstance(d[0], List)) or \
            (isinstance(d, List) and isinstance(d[0], types.Location)), \
            'Target should be a Well or List[Well] but is {}'.format(d)

        # TODO: Account for cases where a src/dest list has a non-first-row
        # well (eg, 'B1') and would expect the robot/pipette to
        # understand that it is referring to the whole first column
        if isinstance(s, List) and isinstance(s[0], List):
            # s is a List[List]]; flatten to 1D list
            s = [well for list_elem in s for well in list_elem]
        elif isinstance(s, Well) or isinstance(s, types.Location):
            s = [s]
        new_src = []
        for well in s:
            if self._is_valid_row(well):
                new_src.append(well)
        self._check_valid_well_list(new_src, 'source', s)

        if isinstance(d, List) and isinstance(d[0], List):
            # s is a List[List]]; flatten to 1D list
            d = [well for list_elem in d for well in list_elem]
        elif isinstance(d, Well) or isinstance(d, types.Location):
            d = [d]
        new_dst = []
        for well in d:
            if self._is_valid_row(well):
                new_dst.append(well)
        self._check_valid_well_list(new_dst, 'target', d)
        return new_src, new_dst

    def _is_valid_row(self, well: Union[Well, types.Location]):
        if isinstance(well, types.Location):
            test_well: Well = well.labware  # type: ignore
        else:
            test_well = well

        if self._api_version < APIVersion(2, 2):
            return test_well in test_well.parent.rows()[0]
        else:
            # Allow the first 2 rows to be accessible to 384-well plates;
            # otherwise, only the first row is accessible
            if test_well.parent.parameters['format'] == '384Standard':
                valid_wells = [
                    well for row in test_well.parent.rows()[:2]
                    for well in row]
                return test_well in valid_wells
            else:
                return test_well in test_well.parent.rows()[0]
