from enum import Enum


class ModuleType(str, Enum):
    """Module type enumeration."""

    Magnetic = "magdeck"
    Temperature = "tempdeck"
    Thermocycler = "thermocycler"
    Heatershaker = "heatershaker"
