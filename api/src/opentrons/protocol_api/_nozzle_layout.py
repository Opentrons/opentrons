from typing_extensions import Final
import enum


class NozzleLayout(enum.Enum):
    COLUMN = "COLUMN"
    SINGLE = "SINGLE"
    ROW = "ROW"
    QUADRANT = "QUADRANT"
    EMPTY = "EMPTY"


COLUMN: Final = NozzleLayout.COLUMN
EMPTY: Final = NozzleLayout.EMPTY

# Set __doc__ manually as a workaround. When this docstring is written the normal way, right after
# the constant definition, Sphinx has trouble picking it up.
COLUMN.__doc__ = """\
A special nozzle configuration type indicating a full single column pick up. Predominantly meant for the 96 channel.

See <ADD REFERENCE HERE> for details on using ``COLUMN`` with :py:obj:`InstrumentContext.configure_nozzle_layout()`.
"""
EMPTY.__doc__ = """\
A special nozzle configuration type indicating a reset back to default where the pipette will pick up its max capacity of tips.

See <ADD REFERENCE HERE> for details on using ``RESET`` with :py:obj:`InstrumentContext.configure_nozzle_layout()`.
"""
