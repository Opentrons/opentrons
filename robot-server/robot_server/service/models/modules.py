import typing

from pydantic import BaseModel, Field


class TemperatureModuleLiveData(BaseModel):
    """Temperature Module live data"""
    currentTemp: float = \
        Field(...,
              description="The current temperature of the module")
    targetTemp: typing.Optional[float] = \
        Field(...,
              description="The target temperature of the module if any")


class MagneticModuleLiveData(BaseModel):
    """Magnetic Module live data"""
    engaged: bool = \
        Field(...,
              description="Whether the magnets are raised or lowered")
    height: float = \
        Field(...,
              description="The height of the top of the magnets relative to "
                          "their home position, in mm")


class ThermocyclerModuleLiveData(BaseModel):
    """Thermocycler live data"""
    lid: str = Field(..., description="The current state of the lid")
    lidTarget: typing.Optional[float] = \
        Field(...,
              description="The target temperature of the lid temperature "
                          "controller")
    lidTemp: float = \
        Field(...,
              description="The current temperature of the lid")
    currentTemp: float = \
        Field(...,
              description="The current temperature of the thermocycler block")
    targetTemp: typing.Optional[float] = \
        Field(...,
              description="The target temperature of the thermocycler block")
    holdTime: typing.Optional[float] = \
        Field(...,
              description="The time left in the current hold step, if any (in "
                          "seconds)")
    rampRate: typing.Optional[float] = \
        Field(...,
              description="The current ramp rate (in degC/s) for the "
                          "thermocycler block")
    currentCycleIndex: typing.Optional[int] = \
        Field(...,
              description="The index of the current cycle within the current "
                          "programmed sequence")
    totalCycleCount: typing.Optional[int] = \
        Field(...,
              description="The total number of cycles within the current "
                          "sequence")
    currentStepIndex: typing.Optional[int] = \
        Field(...,
              description="The index of the current step within the current "
                          "programmed cycle")
    totalStepCount: typing.Optional[int] = \
        Field(...,
              description="The total number of steps within the current cycle")


ModuleLiveData = typing.Union[
    TemperatureModuleLiveData, MagneticModuleLiveData,
    ThermocyclerModuleLiveData]


class Module(BaseModel):
    """An object identifying a module"""
    name: str = \
        Field(...,
              description="A machine readable identifying name for a module. "
                          "Deprecated. Prefer moduleModel", )
    displayName: str = \
        Field(...,
              description="A human-presentable name of the module. Deprecated."
                          " Prefer lookup in the def", )
    moduleModel: str = \
        Field(...,
              description="The model of the module (e.g. magneticModuleV1)")
    port: str = \
        Field(...,
              description="The virtual port to which the module is attached", )
    serial: str = \
        Field(...,
              description="The unique serial number of the module", )
    model: str = \
        Field(...,
              description="The model identifier (i.e. the part number). "
                          "Deprecated. Prefer revision", )
    revision: str = \
        Field(...,
              description="The hardware identifier (i.e. the part number)")
    fwVersion: str = \
        Field(..., description="The current firmware version", )
    hasAvailableUpdate: bool = \
        Field(..., description="If set, a module update is available")
    status: str = \
        Field(...,
              description="A human-readable module-specific status", )
    data: ModuleLiveData


class Modules(BaseModel):
    """A list of all attached modules and the status of each one"""
    modules: typing.List[Module]

    class Config:
        schema_extra = {"examples": {
            "nothingAttached": {
                "description": "With no modules present",
                "value": {
                    "modules": []
                }
            },
            "magneticModuleAttached": {
                "description": "With a Magnetic Module attached",
                "value": {
                    "modules": [
                        {
                            "name": "magdeck",
                            "displayName": "Magnetic Module",
                            "moduleModel": "magneticModuleV1",
                            "port": "tty01_magdeck",
                            "serial": "MDV2313121",
                            "model": "mag_deck_v4.0",
                            "revision": "mag_deck_v4.0",
                            "fwVersion": "2.1.3",
                            "status": "engaged",
                            "hasAvailableUpdate": True,
                            "data": {
                                "engaged": True,
                                "height": 10
                            }
                        }
                    ]
                }
            },
            "tempDeckAttached": {
                "description": "With a Temperature Module attached",
                "value": {
                    "modules": [
                        {
                            "name": "tempdeck",
                            "displayName": "Temperature Module",
                            "moduleModel": "temperatureModuleV1",
                            "revision": "temp_deck_v10",
                            "port": "tty2_tempdeck",
                            "serial": "TDV10231231",
                            "model": "temp_deck_v10",
                            "hasAvailableUpdate": False,
                            "fwVersion": "1.2.0",
                            "status": "cooling",
                            "data": {
                                "currentTemp": 25,
                                "targetTemp": 10
                            }
                        }
                    ]
                }
            },
            "thermocyclerAttached": {
                "description": "With a Thermocycler attached",
                "value": {
                    "modules": [
                        {
                            "name": "thermocycler",
                            "displayName": "Thermocycler",
                            "revision": "thermocycler_v10",
                            "moduleModel": "thermocyclerModuleV1",
                            "port": "tty3_thermocycler",
                            "serial": "TCV1006052018",
                            "model": "thermocycler_v10",
                            "hasAvailableUpdate": True,
                            "fwVersion": "1.0.0",
                            "status": "cooling",
                            "data": {
                                "lid": "closed",
                                "lidTarget": 10,
                                "lidTemp": 15,
                                "currentTemp": 20,
                                "targetTemp": 10,
                                "holdTime": None,
                                "rampRate": 10,
                                "currentCycleIndex": None,
                                "totalCycleCount": None,
                                "currentStepIndex": None,
                                "totalStepCount": None
                            }
                        }
                    ]
                }
            }
        }
        }


class ModuleSerial(BaseModel):
    """Data from the module"""
    status: str = Field(...,
                        description="A human-readable module-specific status")
    data: ModuleLiveData


class SerialCommand(BaseModel):
    """The serialized module call"""
    command_type: str = \
        Field(...,
              description="The name of the module function to call")
    args: typing.Optional[typing.List[str]] = \
        Field(None,
              description="The ordered args list for the call")

    class Config:
        schema_extra = {"examples": {
            "tempModSetTemp": {
                "summary": "Set Temperature Module temperature",
                "description": "Set the temperature of an attached "
                               "Temperature Module",
                "value": {
                    "command_type": "set_temperature",
                    "args": [60]
                }
            }
        }}


class SerialCommandResponse(BaseModel):
    """"The result of a successful call"""
    message: str = Field(..., description="A human readable string")
    returnValue: str = Field(None,
                             description="The return value from the call")

    class Config:
        schema_extra = {"examples": {
            "tempModSetTemperature": {
                "summary": "Set temperature OK",
                "description": "A successful call to set_temperature "
                               "on a Temperature Module",
                "value": {
                    "message": "Success",
                    "returnValue": None
                }
            }
        }}
