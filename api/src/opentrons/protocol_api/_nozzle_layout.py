from typing_extensions import Final
import enum


class NozzleLayout(enum.Enum):
    COLUMN = "COLUMN"
    PARTIAL_COLUMN = "PARTIAL_COLUMN"
    SINGLE = "SINGLE"
    ROW = "ROW"
    QUADRANT = "QUADRANT"
    ALL = "ALL"


COLUMN: Final = NozzleLayout.COLUMN
PARTIAL_COLUMN: Final = NozzleLayout.PARTIAL_COLUMN
SINGLE: Final = NozzleLayout.SINGLE
ROW: Final = NozzleLayout.ROW
ALL: Final = NozzleLayout.ALL

# Set __doc__ manually as a workaround. When this docstring is written the normal way, right after
# the constant definition, Sphinx has trouble picking it up.
COLUMN.__doc__ = """\
A special nozzle configuration type indicating a full single column pick up. Predominantly meant for the 96 channel.

See <ADD REFERENCE HERE> for details on using ``COLUMN`` with :py:obj:`InstrumentContext.configure_nozzle_layout()`.
"""
ALL.__doc__ = """\
A special nozzle configuration type indicating a reset back to default where the pipette will pick up its max capacity of tips.

See <ADD REFERENCE HERE> for details on using ``ALL`` with :py:obj:`InstrumentContext.configure_nozzle_layout()`.
"""
