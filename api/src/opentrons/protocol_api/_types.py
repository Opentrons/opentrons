from __future__ import annotations
from typing_extensions import Final
import enum


# TODO (tz, 5-18-23): think about a better name for it that would also work when we include staging area slots in the type.
class OffDeckType(enum.Enum):
    OFF_DECK = "off-deck"


OFF_DECK: Final = OffDeckType.OFF_DECK

# Set __doc__ manually as a workaround. When this docstring is written the normal way, right after
# the constant definition, Sphinx has trouble picking it up.
OFF_DECK.__doc__ = """\
A special location value, indicating that a labware is not currently on the robot's deck.

See :ref:`off-deck-location` for details on using ``OFF_DECK`` with :py:obj:`ProtocolContext.move_labware()`.
"""
