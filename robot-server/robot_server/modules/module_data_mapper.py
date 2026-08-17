"""Module identification and response data mapping."""

from typing import Annotated, Optional, Type, cast

from fastapi import Depends
from opentrons_hardware.hardware_control.types import PCBARevision

from opentrons.drivers.rpi_drivers.types import USBPort as HardwareUSBPort
from opentrons.drivers.types import (
    AbsorbanceReaderLidStatus,
    AbsorbanceReaderPlatePresence,
    HeaterShakerLabwareLatchStatus,
    ThermocyclerLidStatus,
)
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.modules import (
    AbsorbanceReaderStatus,
    FlexStackerStatus,
    HeaterShakerStatus,
    LiveData,
    MagneticStatus,
    ModuleDataValidator,
    ModuleType,
    PlatformState,
    SpeedStatus,
    TemperatureStatus,
    VacuumModuleStatus,
    VacuumOperationMode,
    VentStatus,
)
from opentrons.hardware_control.modules.magdeck import OFFSET_TO_LABWARE_BOTTOM
from opentrons.hardware_control.modules.types import HopperDoorState, LatchState
from opentrons.hardware_control.types import SubSystem
from opentrons.protocol_engine import DeckType, ModuleModel
from opentrons_shared_data.module import load_definition

from .module_identifier import ModuleIdentity
from .module_models import (
    AbsorbanceReaderModule,
    AbsorbanceReaderModuleData,
    AttachedModule,
    AttachedModuleData,
    FlexStackerModule,
    FlexStackerModuleData,
    HeaterShakerModule,
    HeaterShakerModuleData,
    MagneticModule,
    MagneticModuleData,
    ModuleCalibrationData,
    TemperatureModule,
    TemperatureModuleData,
    ThermocyclerModule,
    ThermocyclerModuleData,
    UsbPort,
    VacuumModule,
    VacuumModuleData,
)
from robot_server.hardware import (
    HardwareStateStore,
    get_deck_type,
    get_hardware,
    get_hardware_state_store,
)


class ModuleDataMapper:
    """Map hardware control modules to module response."""

    def __init__(
        self,
        deck_type: Annotated[DeckType, Depends(get_deck_type)],
        hardware: Annotated[HardwareControlAPI, Depends(get_hardware)],
        hardware_state_store: Annotated[
            HardwareStateStore, Depends(get_hardware_state_store)
        ],
    ) -> None:
        self.deck_type = deck_type
        self.hardware = hardware
        self.hardware_state_store = hardware_state_store

    def map_data(  # noqa: C901
        self,
        model: str,
        module_identity: ModuleIdentity,
        has_available_update: bool,
        live_data: LiveData,
        usb_port: HardwareUSBPort,
        module_offset: Optional[ModuleCalibrationData],
    ) -> AttachedModule:
        """Map hardware control data to an attached module response."""
        module_model = ModuleModel(model)
        module_type = module_model.as_type()

        module_cls: Type[AttachedModule]
        module_data: AttachedModuleData
        module_definition = load_definition(model_or_loadname=model, version="3")
        compatible_with_robot = (
            self.deck_type.value not in module_definition["incompatibleWithDecks"]
        )

        # rely on Pydantic to check/coerce data fields from dicts at run time
        if module_type == ModuleType.MAGNETIC:
            module_cls = MagneticModule
            assert ModuleDataValidator.is_magnetic_module_data(live_data["data"])
            live_data_height = live_data["data"].get("height")
            assert isinstance(live_data_height, (int, float)), (
                f"Expected magnetic module height, got {live_data_height}"
            )

            # Origin of height reported by hardware API is the magnet home
            # Origin we report to the user should be labware bottom
            # Also, magnetic module v1 reports height in half millimeters
            height_from_base = live_data_height - OFFSET_TO_LABWARE_BOTTOM[model]
            if module_model == ModuleModel.MAGNETIC_MODULE_V1:
                height_from_base /= 2

            module_data = MagneticModuleData(
                status=MagneticStatus(live_data["status"]),
                engaged=live_data["data"].get("engaged"),
                height=height_from_base,
            )

        elif module_type == ModuleType.TEMPERATURE:
            module_cls = TemperatureModule
            assert ModuleDataValidator.is_temperature_module_data(live_data["data"])
            module_data = TemperatureModuleData(
                status=TemperatureStatus(live_data["status"]),
                targetTemperature=live_data["data"].get("targetTemp"),
                currentTemperature=live_data["data"].get("currentTemp"),
            )

        elif module_type == ModuleType.THERMOCYCLER:
            module_cls = ThermocyclerModule
            assert ModuleDataValidator.is_thermocycler_data(live_data["data"])
            module_data = ThermocyclerModuleData(
                status=TemperatureStatus(live_data["status"]),
                targetTemperature=cast(float, live_data["data"].get("targetTemp")),
                currentTemperature=cast(float, live_data["data"].get("currentTemp")),
                lidStatus=cast(ThermocyclerLidStatus, live_data["data"].get("lid")),
                lidTemperatureStatus=cast(
                    TemperatureStatus, live_data["data"].get("lidTempStatus")
                ),
                lidTemperature=live_data["data"].get("lidTemp"),
                lidTargetTemperature=cast(float, live_data["data"].get("lidTarget")),
                holdTime=cast(float, live_data["data"].get("holdTime")),
                rampRate=cast(float, live_data["data"].get("rampRate")),
                currentCycleIndex=cast(int, live_data["data"].get("currentCycleIndex")),
                totalCycleCount=cast(int, live_data["data"].get("totalCycleCount")),
                currentStepIndex=cast(int, live_data["data"].get("currentStepIndex")),
                totalStepCount=cast(int, live_data["data"].get("totalStepCount")),
            )

        elif module_type == ModuleType.HEATER_SHAKER:
            module_cls = HeaterShakerModule
            assert ModuleDataValidator.is_heater_shaker_data(live_data["data"])
            module_data = HeaterShakerModuleData(
                status=HeaterShakerStatus(live_data["status"]),
                labwareLatchStatus=cast(
                    HeaterShakerLabwareLatchStatus,
                    live_data["data"].get("labwareLatchStatus"),
                ),
                speedStatus=cast(SpeedStatus, live_data["data"].get("speedStatus")),
                currentSpeed=live_data["data"].get("currentSpeed"),
                targetSpeed=cast(int, live_data["data"].get("targetSpeed")),
                temperatureStatus=cast(
                    TemperatureStatus, live_data["data"].get("temperatureStatus")
                ),
                currentTemperature=live_data["data"].get("currentTemp"),
                targetTemperature=live_data["data"].get("targetTemp"),
                errorDetails=live_data["data"].get("errorDetails"),
            )
        elif module_type == ModuleType.ABSORBANCE_READER:
            assert ModuleDataValidator.is_absorbance_reader_data(live_data["data"])
            module_cls = AbsorbanceReaderModule
            module_data = AbsorbanceReaderModuleData(
                status=AbsorbanceReaderStatus(live_data["status"]),
                lidStatus=cast(
                    AbsorbanceReaderLidStatus, live_data["data"].get("lidStatus")
                ),
                platePresence=cast(
                    AbsorbanceReaderPlatePresence,
                    live_data["data"].get("platePresence"),
                ),
                measureMode=live_data["data"].get("measureMode"),
                sampleWavelengths=live_data["data"].get("sampleWavelengths"),
                referenceWavelength=live_data["data"].get("referenceWavelength"),
                errorDetails=cast(str, live_data["data"].get("errorDetails")),
            )
        elif module_type == ModuleType.FLEX_STACKER:
            module_cls = FlexStackerModule
            assert ModuleDataValidator.is_flex_stacker_data(live_data["data"])
            module_data = FlexStackerModuleData(
                status=FlexStackerStatus(live_data["status"]),
                latchState=cast(LatchState, live_data["data"].get("latchState")),
                platformState=cast(
                    PlatformState, live_data["data"].get("platformState")
                ),
                hopperDoorState=cast(
                    HopperDoorState, live_data["data"].get("hopperDoorState")
                ),
                installDetected=live_data["data"].get("installDetected"),
                errorDetails=cast(str, live_data["data"].get("errorDetails")),
            )

            # Make sure this robot is compatible with the Flex Stacker by
            # checking the rear panel revision, which has been updated to D1 to
            # support the Stacker.
            compatible_with_robot = False
            if self.deck_type == DeckType.OT3_STANDARD:
                compatible_with_robot = self.hardware.is_simulator
                rear_panel = self.hardware_state_store.attached_subsystems.get(
                    SubSystem.rear_panel
                )
                if rear_panel is not None:
                    rear_panel_rev = PCBARevision.from_string(rear_panel.pcba_revision)
                    compatible_with_robot = rear_panel_rev >= PCBARevision("D1")
        elif module_type == ModuleType.VACUUM_MODULE:
            module_cls = VacuumModule
            assert ModuleDataValidator.is_vacuum_module_data(live_data["data"])
            module_data = VacuumModuleData(
                status=VacuumModuleStatus(live_data["status"]),
                currentPressure=cast(float, live_data["data"].get("currentPressure")),
                targetPressure=cast(float, live_data["data"].get("targetPressure")),
                currentPower=cast(float, live_data["data"].get("currentPower")),
                targetPower=cast(float, live_data["data"].get("targetPower")),
                ventStatus=cast(VentStatus, live_data["data"].get("ventStatus")),
                modeType=cast(VacuumOperationMode, live_data["data"].get("modeType")),
                errorDetails=cast(str, live_data["data"].get("errorDetails")),
            )
        else:
            assert False, f"Invalid module type {module_type}"

        return module_cls(
            id=module_identity.module_id,
            serialNumber=module_identity.serial_number,
            firmwareVersion=module_identity.firmware_version,
            hardwareRevision=module_identity.hardware_revision,
            hasAvailableUpdate=has_available_update,
            compatibleWithRobot=compatible_with_robot,
            usbPort=UsbPort(
                port=usb_port.port_number,
                portGroup=usb_port.port_group,
                hub=usb_port.hub,
                hubPort=usb_port.hub_port,
                path=usb_port.device_path,
            ),
            # types of below fields are already checked at runtime
            moduleType=module_type,  # type: ignore[arg-type]
            moduleModel=module_model,  # type: ignore[arg-type]
            data=module_data,  # type: ignore[arg-type]
            moduleOffset=module_offset,
        )
