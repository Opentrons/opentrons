"""Types describing the records a deletion key can point at."""

from typing import Final, Literal

# The record-type discriminator stored alongside a deletion key. Today the only
# kind of record with deletion keys is a log period; this is a union of a single
# member so more record types can be added later.
DeletionKeyForeignType = Literal["logPeriod"]

LOG_PERIOD_FOREIGN_TYPE: Final[DeletionKeyForeignType] = "logPeriod"
