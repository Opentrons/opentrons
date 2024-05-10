"""Constants and datashapes used in the protocol generation."""

import enum
import typing

ColumnName = typing.Literal["1", "2", "3"]
RowName = typing.Literal["a", "b", "c", "d"]
DeckConfigurationSlotName = typing.Literal[
    "a1",
    "a2",
    "a3",
    "b1",
    "b2",
    "b3",
    "c1",
    "c2",
    "c3",
    "d1",
    "d2",
    "d3",
]
AllSlotName = typing.Literal[
    "a1",
    "a2",
    "a3",
    "a4",
    "b1",
    "b2",
    "b3",
    "b4",
    "c1",
    "c2",
    "c3",
    "c4",
    "d1",
    "d2",
    "d3",
    "d4",
]


PROTOCOL_CONTEXT_VAR_NAME: typing.Final[str] = "protocol_context"


class PipetteNames(str, enum.Enum):
    """Names of the pipettes used in the protocol."""

    SINGLE_CHANNEL = "flex_1channel_1000"
    MULTI_CHANNEL = "flex_8channel_1000"
    NINETY_SIX_CHANNEL = "flex_96channel_1000"


class ModuleInfo(enum.Enum):
    """Names of the modules used in the protocol."""

    MAGNETIC_BLOCK_MODULE = ("magneticBlockV1", lambda x: f"mag_block_module_{x}")
    THERMOCYCLER_MODULE = ("thermocyclerModuleV2", lambda x: "thermocycler_module")
    TEMPERATURE_MODULE = ("temperatureModuleV2", lambda x: f"temperature_module_{x}")
    HEATER_SHAKER_MODULE = (
        "heaterShakerModuleV1",
        lambda x: f"heater_shaker_module_{x}",
    )

    def __init__(
        self, load_name: str, name_creation_function: typing.Callable[[str], str]
    ) -> None:
        """Initialize the ModuleNames enum."""
        self.load_name = load_name
        self.name_creation_function = name_creation_function

    def variable_name(self, location: str) -> str:
        """Return the variable name for the module."""
        return self.name_creation_function(location)


class ProtocolContextMethods(str, enum.Enum):
    """Methods available on the protocol context."""

    LOAD_MODULE = "load_module"
    LOAD_LABWARE = "load_labware"
    LOAD_INSTRUMENT = "load_instrument"
    LOAD_WASTE_CHUTE = "load_waste_chute"
    LOAD_TRASH_BIN = "load_trash_bin"


if __name__ == "__main__":
    print(list(ModuleInfo.__members__.keys()))
