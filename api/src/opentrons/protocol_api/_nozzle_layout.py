import enum

from typing_extensions import Final


class NozzleLayout(enum.Enum):
    COLUMN = "COLUMN"
    PARTIAL_COLUMN = "PARTIAL_COLUMN"
    SINGLE = "SINGLE"
    ROW = "ROW"
    QUADRANT = "QUADRANT"
    ALL = "ALL"


COLUMN: Final = NozzleLayout.COLUMN
"""A nozzle configuration type indicating a full, single-column pickup. Predominantly meant for 96-channel pipettes.

See [Column layout](../pipettes/partial-tip-pickup.md#column-layout) for details on using `COLUMN` with [`InstrumentContext.configure_nozzle_layout()`][opentrons.protocol_api.InstrumentContext.configure_nozzle_layout].
"""

PARTIAL_COLUMN: Final = NozzleLayout.PARTIAL_COLUMN
"""A nozzle configuration type indicating a pickup of 2 to 7 consecutive tips in a single column. Available on 8-channel pipettes only.

See [Partial column layout](../pipettes/partial-tip-pickup.md#partial-column-layout) for details on using `PARTIAL_COLUMN` with [`InstrumentContext.configure_nozzle_layout()`][opentrons.protocol_api.InstrumentContext.configure_nozzle_layout].
"""

SINGLE: Final = NozzleLayout.SINGLE
"""A nozzle configuration type indicating a single-tip pickup. Available on both 8-channel and 96-channel pipettes.

See [Single layout](../pipettes/partial-tip-pickup.md#single-layout) for details on using `SINGLE` with [`InstrumentContext.configure_nozzle_layout()`][opentrons.protocol_api.InstrumentContext.configure_nozzle_layout].
"""

ROW: Final = NozzleLayout.ROW
"""A nozzle configuration type indicating a full, single-row pickup. Available on 96-channel pipettes only.

See [Row layout](../pipettes/partial-tip-pickup.md#row-layout) for details on using `ROW` with [`InstrumentContext.configure_nozzle_layout()`][opentrons.protocol_api.InstrumentContext.configure_nozzle_layout].
"""

ALL: Final = NozzleLayout.ALL
"""A nozzle configuration type indicating a reset back to default where the pipette will pick up its maximum number of tips.

See [Tip rack adapters](../pipettes/partial-tip-pickup.md#tip-rack-adapters) for details on using `ALL` with [`InstrumentContext.configure_nozzle_layout()`][opentrons.protocol_api.InstrumentContext.configure_nozzle_layout].
"""
