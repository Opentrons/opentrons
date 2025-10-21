"""Constants and datashapes used in the protocol generation."""

import enum
import typing
import dataclasses

ECHO_ANALYSIS_RESULTS_ENV_VAR_NAME: typing.Final[str] = "ECHO_ANALYSIS_RESULTS"

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

ProtocolContextMethod = typing.Literal[
    "load_module",
    "load_labware",
    "load_instrument",
    "load_waste_chute",
    "load_trash_bin",
]

PROTOCOL_CONTEXT_VAR_NAME: typing.Final[str] = "protocol_context"


class PipetteNames(str, enum.Enum):
    """Names of the pipettes used in the protocol."""

    SINGLE_CHANNEL = "flex_1channel_1000"
    MULTI_CHANNEL = "flex_8channel_1000"
    NINETY_SIX_CHANNEL = "flex_96channel_1000"


@dataclasses.dataclass
class ModuleInfo:
    """Information about a module."""

    load_name: str
    name_creation_function: typing.Callable[[str], str]

    def variable_name(self, location: str) -> str:
        """Return the variable name for the module."""
        return self.name_creation_function(location)


class Modules:
    """Module names used in the protocol."""

    MAGNETIC_BLOCK_MODULE = ModuleInfo(
        load_name="magneticBlockV1",
        name_creation_function=lambda x: f"mag_block_module_{x}",
    )
    THERMOCYCLER_MODULE = ModuleInfo(
        load_name="thermocyclerModuleV2",
        name_creation_function=lambda x: "thermocycler_module",
    )
    TEMPERATURE_MODULE = ModuleInfo(
        load_name="temperatureModuleV2",
        name_creation_function=lambda x: f"temperature_module_{x}",
    )
    HEATER_SHAKER_MODULE = ModuleInfo(
        load_name="heaterShakerModuleV1",
        name_creation_function=lambda x: f"heater_shaker_module_{x}",
    )

    @classmethod
    def modules(cls) -> typing.List[ModuleInfo]:
        """Get all the module info."""
        return [
            cls.MAGNETIC_BLOCK_MODULE,
            cls.THERMOCYCLER_MODULE,
            cls.TEMPERATURE_MODULE,
            cls.HEATER_SHAKER_MODULE,
        ]

    @classmethod
    def get_module_info(cls, module_name: str) -> ModuleInfo:
        """Get the ModuleInfo for the given module name."""
        return getattr(cls, module_name.upper())  # type: ignore
