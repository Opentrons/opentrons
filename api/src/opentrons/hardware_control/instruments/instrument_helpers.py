from typing import List, Tuple

from opentrons_shared_data.pipette.pipette_definition import PipetteFunctionKeyType

PIPETTING_FUNCTION_FALLBACK_VERSION: PipetteFunctionKeyType = "1"
PIPETTING_FUNCTION_LATEST_VERSION: PipetteFunctionKeyType = "2"


def piecewise_volume_conversion(
    ul: float, sequence: List[Tuple[float, float, float]]
) -> float:
    """
    Takes a volume in microliters and a sequence representing a piecewise
    function for the slope and y-intercept of a ul/mm function, where each
    sub-list in the sequence contains:

      - the max volume for the piece of the function (minimum implied from the
        max of the previous item or 0
      - the slope of the segment
      - the y-intercept of the segment

    :return: the ul/mm value for the specified volume
    """
    # pick the first item from the seq for which the target is less than
    # the bracketing element
    for x in sequence:
        if ul <= x[0]:
            # use that element to calculate the movement distance in mm
            return x[1] * ul + x[2]

    # Compatibility with previous implementation of search.
    #  list(filter(lambda x: ul <= x[0], sequence))[0]
    raise IndexError()
