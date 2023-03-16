"""Calibrate-module command for OT3 hardware. request, result, and implementation models."""
from typing import Optional, Type
from typing_extensions import Literal
from pydantic import BaseModel, Field

from ..command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
)
from ...types import DeckSlotLocation, ModuleModel, ModuleOffsetVector

from opentrons.protocol_engine.resources.ot3_validation import ensure_ot3_hardware


from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.types import OT3Mount
from opentrons.hardware_control import ot3_calibration as calibration

from opentrons.types import DeckSlotName, MountType, Point

CalibrateModuleCommandType = Literal["calibration/calibrateModule"]


class CalibrateModuleParams(BaseModel):
    """Payload required to calibrate-module."""

    model: ModuleModel = Field(..., description="The model name of the module to calibrate.")
    moduleID: str = Field(..., description="The unique id of module to calibrate.")
    location: DeckSlotLocation = Field(..., description="The slot location this module is in.")
    mount: MountType = Field(..., description="The instrument mount used to calibrate the module.")


class CalibrateModuleResult(BaseModel):
    """Result data from the execution of a calibrate-module command."""

    moduleOffset: ModuleOffsetVector = Field(
        ..., description="Offset of calibrated module."
    )


class CalibrateModuleImplementation(
    AbstractCommandImpl[CalibrateModuleParams, CalibrateModuleResult]
):
    """CalibrateModule command implementation."""

    def __init__(
        self,
        hardware_api: HardwareControlAPI,
        **kwargs: object,
    ) -> None:
        self._hardware_api = hardware_api

    async def execute(self, params: CalibrateModuleParams) -> CalibrateModuleResult:
        """Execute calibrate-module command."""
        ot3_api = ensure_ot3_hardware(
            self._hardware_api,
        )
        ot3_mount = OT3Mount.from_mount(params.mount)
        module_type = ModuleModel(params.model).as_type()
        module_id = str(params.moduleID)
        slot = DeckSlotName(params.location.slotName).as_int()
        # TODO (ba, 2023-03-15): once we have the calibration adapter definitions, load module geometries and pass in nominal_position.
        nominal_position = Point()
        module_offset = await calibration.calibrate_module(
            ot3_api, ot3_mount, slot, module_type, module_id, nominal_position
        )

        return CalibrateModuleResult(
            moduleOffset=ModuleOffsetVector(
                x=module_offset.x, y=module_offset.y, z=module_offset.z
            )
        )


class CalibrateModule(BaseCommand[CalibrateModuleParams, CalibrateModuleResult]):
    """Calibrate-module command model."""

    commandType: CalibrateModuleCommandType = "calibration/calibrateModule"
    params: CalibrateModuleParams
    result: Optional[CalibrateModuleResult]

    _ImplementationCls: Type[
        CalibrateModuleImplementation
    ] = CalibrateModuleImplementation


class CalibrateModuleCreate(BaseCommandCreate[CalibrateModuleParams]):
    """Create calibrate-module command request model."""

    commandType: CalibrateModuleCommandType = "calibration/calibrateModule"
    params: CalibrateModuleParams

    _CommandCls: Type[CalibrateModule] = CalibrateModule
