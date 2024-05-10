"""Constants and datashapes used in the protocol generation."""

import dataclasses
import typing
import enum

PROTOCOL_CONTEXT_VAR_NAME: typing.Final[str] = "protocol_context"


class PipetteNames(str, enum.Enum):
    """Names of the pipettes used in the protocol."""

    SINGLE_CHANNEL = "flex_1channel_1000"
    MULTI_CHANNEL = "flex_8channel_1000"
    NINETY_SIX_CHANNEL = "flex_96channel_1000"


@dataclasses.dataclass
class PipetteConfiguration:
    """Configuration for a pipette."""

    left: PipetteNames | None
    right: PipetteNames | None


class ModuleNames(str, enum.Enum):
    """Names of the modules used in the protocol."""

    MAGNETIC_BLOCK_MODULE = "magneticBlockV1"
    THERMOCYCLER_MODULE = "thermocyclerModuleV2"
    TEMPERATURE_MODULE = "temperatureModuleV2"
    HEATER_SHAKER_MODULE = "heaterShakerModuleV1"


class ProtocolContextMethods(str, enum.Enum):
    """Methods available on the protocol context."""

    LOAD_MODULE = "load_module"
    LOAD_LABWARE = "load_labware"
    LOAD_INSTRUMENT = "load_instrument"
    LOAD_WASTE_CHUTE = "load_waste_chute"
    LOAD_TRASH_BIN = "load_trash_bin"
