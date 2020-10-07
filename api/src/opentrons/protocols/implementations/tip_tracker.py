from itertools import dropwhile, takewhile
from typing import Optional, Sequence

from opentrons.protocols.implementations.well import WellImplementation


Wells = Sequence[WellImplementation]
WellColumns = Sequence[Wells]


class TipTracker:
    def __init__(self, columns: WellColumns):
        self._columns = columns

    def next_tip(self,
                 num_tips: int = 1,
                 starting_tip: WellImplementation = None) \
            -> Optional[WellImplementation]:
        """
        Find the next valid well for pick-up.

        Determines the next valid start tip from which to retrieve the
        specified number of tips. There must be at least `num_tips` sequential
        wells for which all wells have tips, in the same column.

        :param num_tips: target number of sequential tips in the same column
        :type num_tips: int
        :param starting_tip: The :py:class:`.Well` from which to start search.
                for an available tip.
        :type starting_tip: :py:class:`.Well`
        :return: the :py:class:`.Well` meeting the target criteria, or None
        """
        columns: WellColumns = self._columns
        if starting_tip:
            # Remove columns preceding the one with the pipette's starting tip
            drop_undefined_columns = list(
                dropwhile(lambda x: starting_tip not in x, columns))
            # Remove tips preceding the starting tip in the first column
            drop_undefined_columns[0] = list(
                dropwhile(lambda w: starting_tip is not w,
                          drop_undefined_columns[0]))
            columns = drop_undefined_columns

        drop_leading_empties = [
            list(dropwhile(lambda x: not x.has_tip(), column))
            for column in columns]
        drop_at_first_gap = [
            list(takewhile(lambda x: x.has_tip(), column))
            for column in drop_leading_empties]
        long_enough = [
            column for column in drop_at_first_gap if len(column) >= num_tips]

        try:
            first_long_enough = long_enough[0]
            result: Optional[WellImplementation] = first_long_enough[0]
        except IndexError:
            result = None

        return result

    def use_tips(self,
                 start_well: WellImplementation,
                 num_channels: int = 1,
                 fail_if_full: bool = False):
        """
        Removes tips from the tip tracker.

        This method should be called when a tip is picked up. Generally, it
        will be called with `num_channels=1` or `num_channels=8` for single-
        and multi-channel respectively. If picking up with more than one
        channel, this method will automatically determine which tips are used
        based on the start well, the number of channels, and the geometry of
        the tiprack.

        :param start_well: The :py:class:`.Well` from which to pick up a tip.
                           For a single-channel pipette, this is the well to
                           send the pipette to. For a multi-channel pipette,
                           this is the well to send the back-most nozzle of the
                           pipette to.
        :type start_well: :py:class:`.Well`
        :param num_channels: The number of channels for the current pipette
        :type num_channels: int
        :param fail_if_full: for backwards compatibility
        """
        # Select the column of the labware that contains the target well
        target_column = [col for col in self._columns if start_well in col][0]

        well_idx = target_column.index(start_well)
        # Number of tips to pick up is the lesser of (1) the number of tips
        # from the starting well to the end of the column, and (2) the number
        # of channels of the pipette (so a 4-channel pipette would pick up a
        # max of 4 tips, and picking up from the 2nd-to-bottom well in a
        # column would get a maximum of 2 tips)
        num_tips = min(len(target_column) - well_idx, num_channels)
        target_wells = target_column[well_idx: well_idx + num_tips]

        # In API version 2.2, we no longer reset the tip tracker when a tip
        # is dropped back into a tiprack well. This fixes a behavior where
        # subsequent transfers would reuse the dirty tip. However, sometimes
        # the user explicitly wants to use a dirty tip, and this check would
        # raise an exception if they tried to do so.
        # An extension of work here is to have separate tip trackers for
        # dirty tips and non-present tips; but until then, we can avoid the
        # exception.
        if fail_if_full:
            assert all(well.has_tip() for well in target_wells),\
                '{} is out of tips'.format(str(self))

        for well in target_wells:
            well.set_has_tip(False)

    def previous_tip(self, num_tips: int = 1) -> Optional[WellImplementation]:
        """
        Find the best well to drop a tip in.

        This is the well from which the last tip was picked up, if there's
        room. It can be used to return tips to the tip tracker.

        :param num_tips: target number of tips to return, sequential in a
                         column
        :type num_tips: int
        :return: The :py:class:`.Well` meeting the target criteria, or ``None``
        """
        columns = self._columns
        drop_leading_filled = [
            list(dropwhile(lambda x: x.has_tip(), column))
            for column in columns]
        drop_at_first_gap = [
            list(takewhile(lambda x: not x.has_tip(), column))
            for column in drop_leading_filled]
        long_enough = [
            column for column in drop_at_first_gap if len(column) >= num_tips]
        try:
            return long_enough[0][0]
        except IndexError:
            return None

    def return_tips(self,
                    start_well: WellImplementation,
                    num_channels: int = 1):
        """
        Re-adds tips to the tip tracker

        This method should be called when a tip is dropped in a tiprack. It
        should be called with ``num_channels=1`` or ``num_channels=8`` for
        single- and multi-channel respectively. If returning more than one
        channel, this method will automatically determine which tips are
        returned based on the start well, the number of channels,
        and the tiprack geometry.

        Note that unlike :py:meth:`use_tips`, calling this method in a way
        that would drop tips into wells with tips in them will raise an
        exception; this should only be called on a valid return of
        :py:meth:`previous_tip`.

        :param start_well: The :py:class:`.Well` into which to return a tip.
        :type start_well: :py:class:`.Well`
        :param num_channels: The number of channels for the current pipette
        :type num_channels: int
        """
        # Select the column that contains the target_well
        target_column = [col for col in self._columns if start_well in col][0]
        well_idx = target_column.index(start_well)
        end_idx = min(well_idx + num_channels, len(target_column))
        drop_targets = target_column[well_idx:end_idx]
        for well in drop_targets:
            if well.has_tip():
                raise AssertionError(f'Well {repr(well)} has a tip')
        for well in drop_targets:
            well.set_has_tip(True)
