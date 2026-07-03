# This file contains constants defined for pipettes and liquid handling

from typing import Dict

from opentrons_shared_data.pipette.types import ChannelCount

PIPETTE_X_SPAN: Dict[ChannelCount, float] = {
    1: 75,  # includes a margin
    8: 75,  # includes a margin
    96: 161,
}
"""
The span of pipettes in X-direction based on number of channels.
This is needed in order to determine safe tip drop location within a labware.
"""

VOLUME_ROUNDING_ERROR_TOLERANCE = 1e-9
"""
# Tolerance to use when determining whether two volumes are "close enough" to be considered
# equal. This is required because floating point math in python has precision limitations.
#
# 1e-9 µL (1 femtoliter!) is a good value because:
# * It's large relative to rounding errors that occur in practice in protocols. For
#   example, https://opentrons.atlassian.net/browse/RESC-182 shows a rounding error
#   on the order of 1e-15 µL.
# * It's small relative to volumes that our users might actually care about and
#   expect the robot to execute faithfully.
# * It's the default relative tolerance for math.isclose(), where it apparently works
#   well in general.
"""
