from opentrons_shared_data.util import StrEnum


class ModuleType(StrEnum):
    """Module type enumeration."""

    Magnetic = "magdeck"
    Temperature = "tempdeck"
    Thermocycler = "thermocycler"
    Heatershaker = "heatershaker"
