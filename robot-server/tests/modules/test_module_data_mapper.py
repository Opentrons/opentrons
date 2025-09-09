"""Tests for robot_server.modules.module_data_mapper."""
from decoy import Decoy
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.types import SubSystem, SubSystemState
import pytest

from opentrons.protocol_engine import ModuleModel, DeckType
from opentrons.protocol_engine.types import Vec3f
from opentrons.drivers.rpi_drivers.types import USBPort as HardwareUSBPort, PortGroup
from opentrons.hardware_control.modules import (
    FlexStackerStatus,
    LiveData,
    ModuleType,
    MagneticStatus,
    PlatformState,
    TemperatureStatus,
    HeaterShakerStatus,
    types as hc_types,
)


from robot_server.modules.module_identifier import ModuleIdentity
from robot_server.modules.module_data_mapper import ModuleDataMapper

from robot_server.modules.module_models import (
    FlexStackerModule,
    FlexStackerModuleData,
    UsbPort,
    MagneticModule,
    MagneticModuleData,
    TemperatureModule,
    TemperatureModuleData,
    ThermocyclerModule,
    ThermocyclerModuleData,
    HeaterShakerModule,
    HeaterShakerModuleData,
    ModuleCalibrationData,
)


@pytest.mark.parametrize(
    (
        "input_model",
        "deck_type",
        "input_data",
        "expected_output_data",
        "expected_compatible",
    ),
    [
        (
            "magneticModuleV1",
            DeckType("ot2_standard"),
            {"status": "disengaged", "data": {"engaged": False, "height": 0.0}},
            MagneticModuleData(
                status=MagneticStatus.DISENGAGED,
                engaged=False,
                height=-2.5,
            ),
            True,
        ),
        (
            "magneticModuleV1",
            DeckType("ot3_standard"),
            {"status": "disengaged", "data": {"engaged": False, "height": 0.0}},
            MagneticModuleData(
                status=MagneticStatus.DISENGAGED,
                engaged=False,
                height=-2.5,
            ),
            False,
        ),
        (
            "magneticModuleV1",
            DeckType("ot2_standard"),
            {"status": "engaged", "data": {"engaged": True, "height": 42}},
            MagneticModuleData(
                status=MagneticStatus.ENGAGED,
                engaged=True,
                height=18.5,
            ),
            True,
        ),
        (
            "magneticModuleV2",
            DeckType("ot2_standard"),
            {"status": "disengaged", "data": {"engaged": False, "height": 0.0}},
            MagneticModuleData(
                status=MagneticStatus.DISENGAGED,
                engaged=False,
                height=-2.5,
            ),
            True,
        ),
        (
            "magneticModuleV2",
            DeckType("ot3_standard"),
            {"status": "disengaged", "data": {"engaged": False, "height": 0.0}},
            MagneticModuleData(
                status=MagneticStatus.DISENGAGED,
                engaged=False,
                height=-2.5,
            ),
            False,
        ),
        (
            "magneticModuleV2",
            DeckType("ot2_standard"),
            {"status": "engaged", "data": {"engaged": True, "height": 42}},
            MagneticModuleData(
                status=MagneticStatus.ENGAGED,
                engaged=True,
                height=39.5,
            ),
            True,
        ),
    ],
)
def test_maps_magnetic_module_data(
    input_model: str,
    deck_type: DeckType,
    input_data: LiveData,
    expected_output_data: MagneticModuleData,
    expected_compatible: bool,
    hardware_api: HardwareControlAPI,
) -> None:
    """It should map hardware data to a magnetic module."""
    module_identity = ModuleIdentity(
        module_id="module-id",
        serial_number="serial-number",
        firmware_version="1.2.3",
        hardware_revision="4.5.6",
    )

    hardware_usb_port = HardwareUSBPort(
        name="abc",
        port_number=101,
        port_group=PortGroup.UNKNOWN,
        hub=False,
        hub_port=None,
        device_path="/dev/null",
    )

    subject = ModuleDataMapper(deck_type=deck_type, hardware=hardware_api)
    result = subject.map_data(
        model=input_model,
        module_identity=module_identity,
        has_available_update=True,
        live_data=input_data,
        usb_port=hardware_usb_port,
        module_offset=ModuleCalibrationData.model_construct(
            offset=Vec3f(x=0, y=0, z=0),
        ),
    )

    assert result == MagneticModule(
        id="module-id",
        serialNumber="serial-number",
        firmwareVersion="1.2.3",
        hardwareRevision="4.5.6",
        hasAvailableUpdate=True,
        moduleType=ModuleType.MAGNETIC,
        moduleModel=ModuleModel(input_model),  # type: ignore[arg-type]
        compatibleWithRobot=expected_compatible,
        usbPort=UsbPort(
            port=101,
            portGroup=PortGroup.UNKNOWN,
            hub=False,
            hubPort=None,
            path="/dev/null",
        ),
        data=expected_output_data,
        moduleOffset=ModuleCalibrationData(offset=Vec3f(x=0.0, y=0.0, z=0.0)),
    )


@pytest.mark.parametrize(
    "input_model,deck_type,expected_compatible",
    [
        ("temperatureModuleV1", DeckType("ot2_standard"), True),
        ("temperatureModuleV1", DeckType("ot3_standard"), False),
        ("temperatureModuleV2", DeckType("ot2_standard"), True),
        ("temperatureModuleV2", DeckType("ot3_standard"), True),
    ],
)
@pytest.mark.parametrize(
    "status,data",
    [
        ("idle", {"currentTemp": 42.0, "targetTemp": None}),
        ("holding at target", {"currentTemp": 84.0, "targetTemp": 84.0}),
    ],
)
def test_maps_temperature_module_data(
    input_model: str,
    deck_type: DeckType,
    expected_compatible: bool,
    status: str,
    data: hc_types.TemperatureModuleData,
    hardware_api: HardwareControlAPI,
) -> None:
    """It should map hardware data to a magnetic module."""
    input_data: LiveData = {"status": status, "data": data}
    module_identity = ModuleIdentity(
        module_id="module-id",
        serial_number="serial-number",
        firmware_version="1.2.3",
        hardware_revision="4.5.6",
    )

    hardware_usb_port = HardwareUSBPort(
        name="abc",
        port_number=101,
        port_group=PortGroup.UNKNOWN,
        hub=False,
        hub_port=None,
        device_path="/dev/null",
    )

    subject = ModuleDataMapper(deck_type=deck_type, hardware=hardware_api)
    result = subject.map_data(
        model=input_model,
        module_identity=module_identity,
        has_available_update=True,
        live_data=input_data,
        usb_port=hardware_usb_port,
        module_offset=ModuleCalibrationData.model_construct(
            offset=Vec3f(x=0, y=0, z=0),
        ),
    )

    assert result == TemperatureModule(
        id="module-id",
        serialNumber="serial-number",
        firmwareVersion="1.2.3",
        hardwareRevision="4.5.6",
        hasAvailableUpdate=True,
        moduleType=ModuleType.TEMPERATURE,
        compatibleWithRobot=expected_compatible,
        moduleModel=ModuleModel(input_model),  # type: ignore[arg-type]
        usbPort=UsbPort(
            port=101,
            portGroup=PortGroup.UNKNOWN,
            hub=False,
            hubPort=None,
            path="/dev/null",
        ),
        moduleOffset=ModuleCalibrationData(offset=Vec3f(x=0.0, y=0.0, z=0.0)),
        data=TemperatureModuleData(
            status=TemperatureStatus(status),
            currentTemperature=data["currentTemp"],
            targetTemperature=data["targetTemp"],
        ),
    )


@pytest.mark.parametrize(
    "input_model,deck_type,expected_compatible",
    [
        ("thermocyclerModuleV1", DeckType("ot2_standard"), True),
        ("thermocyclerModuleV1", DeckType("ot3_standard"), False),
        ("thermocyclerModuleV2", DeckType("ot2_standard"), True),
        ("thermocyclerModuleV2", DeckType("ot3_standard"), True),
    ],
)
@pytest.mark.parametrize(
    "status,data",
    [
        (
            "idle",
            {
                "lid": "open",
                "lidTarget": None,
                "lidTemp": None,
                "lidTempStatus": "idle",
                "currentTemp": None,
                "targetTemp": None,
                "holdTime": None,
                "rampRate": None,
                "currentCycleIndex": None,
                "totalCycleCount": None,
                "currentStepIndex": None,
                "totalStepCount": None,
            },
        ),
        (
            "heating",
            {
                "lid": "open",
                "lidTarget": 1,
                "lidTemp": 2,
                "lidTempStatus": "heating",
                "currentTemp": 3,
                "targetTemp": 4,
                "holdTime": 5,
                "rampRate": 6,
                "currentCycleIndex": 7,
                "totalCycleCount": 8,
                "currentStepIndex": 9,
                "totalStepCount": 10,
            },
        ),
    ],
)
def test_maps_thermocycler_module_data(
    input_model: str,
    deck_type: DeckType,
    expected_compatible: bool,
    status: str,
    data: hc_types.ThermocyclerData,
    hardware_api: HardwareControlAPI,
) -> None:
    """It should map hardware data to a magnetic module."""
    input_data: LiveData = {"status": status, "data": data}
    module_identity = ModuleIdentity(
        module_id="module-id",
        serial_number="serial-number",
        firmware_version="1.2.3",
        hardware_revision="4.5.6",
    )

    hardware_usb_port = HardwareUSBPort(
        name="abc",
        port_number=101,
        port_group=PortGroup.UNKNOWN,
        hub=False,
        hub_port=None,
        device_path="/dev/null",
    )

    subject = ModuleDataMapper(deck_type=deck_type, hardware=hardware_api)
    result = subject.map_data(
        model=input_model,
        module_identity=module_identity,
        has_available_update=True,
        live_data=input_data,
        usb_port=hardware_usb_port,
        module_offset=ModuleCalibrationData.model_construct(
            offset=Vec3f(x=0, y=0, z=0),
        ),
    )

    assert result == ThermocyclerModule(
        id="module-id",
        serialNumber="serial-number",
        firmwareVersion="1.2.3",
        hardwareRevision="4.5.6",
        hasAvailableUpdate=True,
        moduleType=ModuleType.THERMOCYCLER,
        compatibleWithRobot=expected_compatible,
        moduleModel=ModuleModel(input_model),  # type: ignore[arg-type]
        usbPort=UsbPort(
            port=101,
            portGroup=PortGroup.UNKNOWN,
            hub=False,
            hubPort=None,
            path="/dev/null",
        ),
        moduleOffset=ModuleCalibrationData(offset=Vec3f(x=0.0, y=0.0, z=0.0)),
        data=ThermocyclerModuleData(
            status=TemperatureStatus(status),
            currentTemperature=data["currentTemp"],
            targetTemperature=data["targetTemp"],
            lidStatus=data["lid"],  # type: ignore[arg-type]
            lidTemperatureStatus=data["lidTempStatus"],  # type: ignore[arg-type]
            lidTemperature=data["lidTemp"],
            lidTargetTemperature=data["lidTarget"],
            holdTime=data["holdTime"],
            rampRate=data["rampRate"],
            currentCycleIndex=data["currentCycleIndex"],
            totalCycleCount=data["totalCycleCount"],
            currentStepIndex=data["currentStepIndex"],
            totalStepCount=data["totalStepCount"],
        ),
    )


@pytest.mark.parametrize(
    "input_model,deck_type",
    [
        ("heaterShakerModuleV1", DeckType("ot2_standard")),
        ("heaterShakerModuleV1", DeckType("ot3_standard")),
    ],
)
@pytest.mark.parametrize(
    "status,data",
    [
        (
            "idle",
            {
                "temperatureStatus": "idle",
                "speedStatus": "idle",
                "labwareLatchStatus": "idle_open",
                "currentTemp": 42,
                "targetTemp": None,
                "currentSpeed": 1337,
                "targetSpeed": None,
                "errorDetails": None,
            },
        ),
        (
            "running",
            {
                "temperatureStatus": "heating",
                "speedStatus": "speeding up",
                "labwareLatchStatus": "idle_closed",
                "currentTemp": 42,
                "targetTemp": 84,
                "currentSpeed": 1337,
                "targetSpeed": 9001,
                "errorDetails": "oh no",
            },
        ),
    ],
)
def test_maps_heater_shaker_module_data(
    input_model: str,
    deck_type: DeckType,
    status: str,
    data: hc_types.HeaterShakerData,
    hardware_api: HardwareControlAPI,
) -> None:
    """It should map hardware data to a magnetic module."""
    input_data: LiveData = {"status": status, "data": data}
    module_identity = ModuleIdentity(
        module_id="module-id",
        serial_number="serial-number",
        firmware_version="1.2.3",
        hardware_revision="4.5.6",
    )

    hardware_usb_port = HardwareUSBPort(
        name="abc",
        port_number=101,
        port_group=PortGroup.UNKNOWN,
        hub=False,
        hub_port=None,
        device_path="/dev/null",
    )

    subject = ModuleDataMapper(deck_type=deck_type, hardware=hardware_api)
    result = subject.map_data(
        model=input_model,
        module_identity=module_identity,
        has_available_update=True,
        live_data=input_data,
        usb_port=hardware_usb_port,
        module_offset=ModuleCalibrationData.model_construct(
            offset=Vec3f(x=0, y=0, z=0),
        ),
    )

    assert result == HeaterShakerModule(
        id="module-id",
        serialNumber="serial-number",
        firmwareVersion="1.2.3",
        hardwareRevision="4.5.6",
        hasAvailableUpdate=True,
        moduleType=ModuleType.HEATER_SHAKER,
        compatibleWithRobot=True,
        moduleModel=ModuleModel(input_model),  # type: ignore[arg-type]
        usbPort=UsbPort(
            port=101,
            portGroup=PortGroup.UNKNOWN,
            hub=False,
            hubPort=None,
            path="/dev/null",
        ),
        moduleOffset=ModuleCalibrationData(offset=Vec3f(x=0.0, y=0.0, z=0.0)),
        data=HeaterShakerModuleData(
            status=HeaterShakerStatus(status),
            labwareLatchStatus=data["labwareLatchStatus"],  # type: ignore[arg-type]
            speedStatus=data["speedStatus"],  # type: ignore[arg-type]
            currentSpeed=data["currentSpeed"],
            targetSpeed=data["targetSpeed"],
            temperatureStatus=data["temperatureStatus"],  # type: ignore[arg-type]
            currentTemperature=data["currentTemp"],
            targetTemperature=data["targetTemp"],
            errorDetails=data["errorDetails"],
        ),
    )


@pytest.mark.parametrize(
    "input_model,deck_type,rear_panel_rev,compatible",
    [
        ("flexStackerModuleV1", DeckType("ot2_standard"), "", False),
        ("flexStackerModuleV1", DeckType("ot3_standard"), "C1", False),
        ("flexStackerModuleV1", DeckType("ot3_standard"), "D1", True),
    ],
)
@pytest.mark.parametrize(
    "status,data",
    [
        (
            "idle",
            {
                "latchState": "closed",
                "platformState": "extended",
                "hopperDoorState": "closed",
                "installDetected": True,
                "errorDetails": "",
            },
        ),
        (
            "dispensing",
            {
                "latchState": "closed",
                "platformState": "retracted",
                "hopperDoorState": "closed",
                "installDetected": True,
                "errorDetails": "",
            },
        ),
    ],
)
def test_maps_flex_stacker_module_data(
    input_model: str,
    deck_type: DeckType,
    rear_panel_rev: str,
    compatible: bool,
    status: str,
    data: hc_types.FlexStackerData,
    hardware_api: HardwareControlAPI,
    decoy: Decoy,
) -> None:
    """It should map hardware data to a flex stacker."""
    input_data: LiveData = {"status": status, "data": data}
    module_identity = ModuleIdentity(
        module_id="module-id",
        serial_number="serial-number",
        firmware_version="1.2.3",
        hardware_revision="4.5.6",
    )

    hardware_usb_port = HardwareUSBPort(
        name="abc",
        port_number=101,
        port_group=PortGroup.RIGHT,
        hub=True,
        hub_port=1,
        device_path="1.0/tty/ttyACM1/dev",
    )
    decoy.when(hardware_api.attached_subsystems).then_return(
        {
            SubSystem.rear_panel: SubSystemState(
                ok=True,
                current_fw_version=63,
                next_fw_version=63,
                fw_update_needed=False,
                current_fw_sha="",
                pcba_revision=rear_panel_rev,
                update_state=None,
            )
        }
    )

    subject = ModuleDataMapper(deck_type=deck_type, hardware=hardware_api)
    result = subject.map_data(
        model=input_model,
        module_identity=module_identity,
        has_available_update=False,
        live_data=input_data,
        usb_port=hardware_usb_port,
        module_offset=None,
    )

    assert result == FlexStackerModule(
        id="module-id",
        serialNumber="serial-number",
        firmwareVersion="1.2.3",
        hardwareRevision="4.5.6",
        hasAvailableUpdate=False,
        moduleType=ModuleType.FLEX_STACKER,
        compatibleWithRobot=compatible,
        moduleModel=ModuleModel(input_model),  # type: ignore[arg-type]
        usbPort=UsbPort(
            port=101,
            portGroup=PortGroup.RIGHT,
            hub=True,
            hubPort=1,
            path="1.0/tty/ttyACM1/dev",
        ),
        moduleOffset=None,
        data=FlexStackerModuleData(
            status=FlexStackerStatus(status),
            latchState=hc_types.LatchState(data["latchState"]),
            platformState=PlatformState(data["platformState"]),
            hopperDoorState=hc_types.HopperDoorState(data["hopperDoorState"]),
            installDetected=data["installDetected"],
            errorDetails=data["errorDetails"],
        ),
    )
