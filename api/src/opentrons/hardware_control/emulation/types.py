from enum import Enum


class ModuleType(str, Enum):
    """Module type enumeration."""

    Magnetic = "magnetic"
    Temperature = "temperature"
    Thermocycler = "thermocycler"
    Heatershaker = "heatershaker"
