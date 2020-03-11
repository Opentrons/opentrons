import typing
from functools import partial
from enum import Enum

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
    args: typing.List[str] = \
        Field(...,
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
    returnValue: str = Field(..., description="The return value from the call")

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


class AttachedPipette(BaseModel):
    """Pipette (if any) attached to the mount"""
    model: typing.Optional[str] = \
        Field(...,
              description="The model of the attached pipette. These are snake "
                          "case as in the Protocol API. This includes the full"
                          " version string")
    name: typing.Optional[str] = \
        Field(...,
              description="The name of the attached pipette - the model "
                          "without the version string")
    tip_length: typing.Optional[float] = \
        Field(...,
              description="The default tip length for this pipette, if "
                          "attached")
    mount_axis: str = \
        Field(...,
              description="The axis that moves this pipette up and down")
    plunger_axis: str = \
        Field(...,
              description="The axis that moves this pipette's plunger")
    id: typing.Optional[str] = \
        Field(...,
              description="The serial number of the attached pipette")


class Pipette(BaseModel):
    """None"""
    left: AttachedPipette
    right: AttachedPipette

    class Config:
        schema_extra = {"example": {
            "left": {
                "model": "p300_single_v1.5",
                "name": "p300_single",
                "tip_length": 51.7,
                "mount_axis": "z",
                "plunger_axis": "b",
                "id": "P3HS12123041"
            },
            "right": {
                "model": None,
                "name": None,
                "tip_length": None,
                "mount_axis": "a",
                "plunger_axis": "c",
                "id": None
            }
        }}


class EngagedMotor(BaseModel):
    """Engaged motor"""
    enabled: bool = Field(..., description="Is engine enabled")


class EngagedMotors(BaseModel):
    """Which motors are engaged"""
    x: EngagedMotor
    y: EngagedMotor
    z: EngagedMotor
    a: EngagedMotor
    b: EngagedMotor
    c: EngagedMotor

    class Config:
        schema_extra = {"example": {
            "x": {"enabled": False},
            "y": {"enabled": True},
            "z": {"enabled": False},
            "a": {"enabled": True},
            "b": {"enabled": False},
            "c": {"enabled": True}
        }}


class MotorName(str, Enum):
    x = "x"
    y = "y"
    z = "z"
    a = "a"
    b = "b"
    c = "c"


class MotionTarget(str, Enum):
    """
    What should be moved. If mount, move the nominal position of the mount;
    if pipette, move the nozzle of the pipette
    """
    pipette = "pipette"
    mount = "mount"


class HomeTarget(str, Enum):
    pipette = "pipette"
    robot = "robot"


Point = typing.List[float]

# Commonly used Point type description and constraints
PointField = partial(Field, ...,
                     description="A point in deck coordinates (x, y, z)",
                     min_items=3, max_items=3)


class ChangePipette(BaseModel):
    target: MotionTarget
    left: Point = PointField()
    right: Point = PointField()


class AttachTip(BaseModel):
    target: MotionTarget
    point: Point = PointField()


class RobotPositions(BaseModel):
    change_pipette: ChangePipette
    attach_tip: AttachTip

    class Config:
        schema_extra = {"example": {
            "positions": {
                "change_pipette": {
                    "target": "mount",
                    "left": [325, 40, 30],
                    "right": [65, 40, 30]
                },
                "attach_tip": {
                    "target": "pipette",
                    "point": [200, 90, 150]
                }
            }
        }}


class Mount(str, Enum):
    right = "right"
    left = "left"


class RobotMoveTarget(BaseModel):
    """None"""
    target: MotionTarget
    point: Point = PointField()
    mount: Mount = Field(..., description="Which mount to move")
    model: typing.Optional[str] = \
        Field(None,
              description="A pipette model that matches the pipette attached "
                          "to the specified mount. Required "
                          "if target is pipette")

    class Config:
        schema_extra = {"examples": {
            "moveLeftMount": {
                "description": "Move the left mount, regardless of what is "
                               "attached to that mount, to a specific "
                               "position. Since you move the mount, the end of"
                               " the pipette will be in different places "
                               "depending on what pipette is attached - but "
                               "you don't have to know what's attached.",
                "summary": "Move left mount",
                "value": {
                    "target": "mount",
                    "point": [100, 100, 80],
                    "mount": "left"
                }
            },
            "moveRightP300Single": {
                "summary": "Move P300 Single on right mount",
                "description": "Move a P300 Single attached to the right mount"
                               " to a specific position. You have to specify "
                               "that it's a P300 Single that you're moving, "
                               "but as long as you specify the correct model "
                               "the end of the pipette will always be at the "
                               "specified position.",
                "value": {
                    "target": "pipette",
                    "mount": "right",
                    "model": "p300_single",
                    "point": [25, 25, 50]
                }
            }
        }}


class RobotHomeTarget(BaseModel):
    """Parameters for the home"""
    target: HomeTarget = \
        Field(...,
              description="What to home. Robot means to home all axes; "
                          "pipette, only that pipette's carriage and pipette "
                          "axes")
    mount: typing.Optional[Mount] = \
        Field(...,
              description="Which mount to home, if target is pipette (required"
                          " in that case)")

    class Config:
        schema_extra = {"examples": {
            "homeGantry": {
                "summary": "Home Gantry",
                "description": "Home the robot's gantry",
                "value": {
                    "target": "robot"
                }
            },
            "homeRight": {
                "summary": "Home right pipette",
                "description": "Home only the right pipette",
                "value": {
                    "target": "pipette",
                    "mount": "right"
                }
            }
        }}


class RobotLightState(BaseModel):
    """Whether a light is (or should be turned) on or off"""
    on: bool = Field(..., description="The light state")
