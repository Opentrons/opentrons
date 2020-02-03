import typing
from enum import Enum

from pydantic import BaseModel, Field, create_model
from opentrons.server.endpoints.settings import _common_settings_reset_options


class AdvancedSetting(BaseModel):
    """An advanced setting (Feature Flag)"""
    id: str = \
        Field(...,
              description="The machine-readable property ID")
    old_id: str = \
        Field(...,
              description="The ID by which the property used to be known; not useful now and may contain spaces "
                          "or hyphens")
    title: str = \
        Field(...,
              description="A human-readable short string suitable for display as the title of the setting")
    description: str =\
        Field(...,
              description="A human-readable long string suitable for display as a paragraph or two explaining "
                          "the setting")
    restart_required: bool =\
        Field(...,
              description="Whether a robot restart is required to make this change take effect")
    value: typing.Optional[bool] =\
        Field(..., description="Whether the setting is off by previous user choice (false), true by user choice "
                               "(true), or off and has never been altered (null)")


AdvancedSettings = typing.List[AdvancedSetting]


class LogLevels(str, Enum):
    """Valid log levels"""
    debug = "debug"
    info = "info"
    warning = "warning"
    error = "error"


class LogLevel(BaseModel):
    """None"""
    log_level: LogLevels = Field(..., description="The value to set (conforming to Python log levels)")


class FactoryResetOption(BaseModel):
    id: str = Field(..., description="A short machine-readable id for the setting")
    name: str = Field(..., description="A short human-readable name for the setting")
    description: str = Field(..., description="A longer human-readable description of the setting")


class FactoryResetOptions(BaseModel):
    """Available values to reset as factory reset"""
    options: typing.List[FactoryResetOption]


FactoryResetCommands = create_model("FactoryResetCommands",
                                    **{x['id']: (typing.Optional[bool], None) for x in _common_settings_reset_options})
FactoryResetCommands.__doc__ = "The specific elements of robot data to reset"


RobotConfigs = typing.Dict[str, typing.Any]


class PipetteSettingsFieldType(str, Enum):
    """The type of the property"""
    float = "float"
    int = "int"


class PipetteSettingsField(BaseModel):
    """A pipette config element identified by the property's name"""
    units: str = Field(..., description="The physical units this value is in (e.g. mm, uL)")
    type: PipetteSettingsFieldType
    min: float = Field(..., description="The minimum acceptable value of the property")
    max: float = Field(..., description="The maximum acceptable value of the property")
    default: float = Field(..., description="The default value of the property")
    value: float = Field(..., description="The current value of the property")


class PipetteSettingsInfo(BaseModel):
    """Metadata about this pipette"""
    name: str = Field(..., description="A pipette name (e.g. \"p300_single\")")
    model: str = Field(..., description="The exact pipette model (e.g. \"p300_single_v1.5\")")


class PipetteSettings(BaseModel):
    info: PipetteSettingsInfo
    setting_fields: typing.Dict[str, PipetteSettingsField] = \
        Field(..., alias="fields", description="The fields of the pipette settings")
    quirks: typing.Dict[str, bool] = \
        Field(...,
              description="Quirks are behavioral changes associated with pipettes. For instance, some models of "
                          "pipette might need to run their drop tip behavior twice. Specific pipettes have "
                          "specific valid quirks which can then be enabled or disabled; quirks that are not originally "
                          "defined as compatible with a specific kind of pipette cannot be added to an incompatible "
                          "pipette. Because quirks are only defined as compatible for a pipette if they should be on, "
                          "the default value for all quirks is true.")


MultiPipetteSettings = typing.Dict[str, PipetteSettings]


class PipetteUpdateField(BaseModel):
    value: typing.Union[None, bool, float] = \
        Field(...,
              description="Boolean if the format if this is a quirk.  The format if this is not a quirk. Must be "
                          "between max and min for this property. Null means reset.")


class PipetteSettingsUpdate(BaseModel):
    setting_fields: typing.Dict[str, PipetteUpdateField] = Field(..., alias="fields")
