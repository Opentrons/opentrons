"""Vacuum manifold 400mbar stress test protocol for the Opentrons Flex."""
from typing import Any, Dict, cast
from datetime import datetime
from pathlib import Path
from opentrons.protocol_api import(
    ParameterContext,
    VacuumModuleContext,
)# type: ignore[import]
from opentrons import protocol_api  # type: ignore[import]
import serial.tools.list_ports  # type: ignore[import]
from opentrons.hardware_control.adapters import SynchronousAdapter
from opentrons.protocol_api.core.engine.module_core import VacuumModuleCore
import dataclasses
import time
import csv


metadata = {"protocolName": "PID DVT VM 200mbar Life Test"}
requirements = {"robotType": "Flex", "apiLevel": "2.30"}

FIXTURE_OFFSET_MM = 1
LABWARE_OFFSET_MM = 0
ASPIRATE_OFFSET_MM = 3 + LABWARE_OFFSET_MM + FIXTURE_OFFSET_MM

OUTPUT_DIR = "/data/vacuum_manifold_life_test_dvt/"

Ard_idVendor = 9025
Ard_idProduct = 105

def add_parameters(parameters: ParameterContext) -> None:
    """Add runtime parameters for this protocol."""
    parameters.add_int(
        "cycles",
        "cycles",
        default=40,
        minimum=1,
        maximum=1042,
        description="Number of liquid + vacuum cycles.",
    )
    parameters.add_int(
        "pressure",
        "pressure",
        default=800,
        minimum=0,
        maximum=1000,
        description="Target absolute pressure (mbar).",
    )
    parameters.add_int(
        "volume",
        "volume",
        default=1000,
        minimum=1,
        maximum=1000,
        description="Aspirate Volume.",
    )
    parameters.add_int(
        "z_offset",
        "z_offset",
        default=30,
        minimum=-100,
        maximum=100,
        description="Z offset for the acroprep or labware.",
    )
    parameters.add_int(
        "vm_run_sec",
        "vm_run_sec",
        default=360,
        minimum=1,
        maximum=1000,
        description="Amount of time to hold steady pressure.",
    )
    parameters.add_int(
        "vm_settle_sec",
        "vm_settle_sec",
        default=10,
        minimum=1,
        maximum=1000,
        description="Amount of time to ramp to target pressure.",
    )
    parameters.add_int(
        "vm_decay_sec",
        "vm_decay_sec",
        default=10,
        minimum=1,
        maximum=1000,
        description="Amount of time to wait for pressure to drop",
    )
    parameters.add_int(
        "vm_vent_sec",
        "vm_vent_sec",
        default=5,
        minimum=1,
        maximum=1000,
        description="Amount of time the vm vent is opened.",
    )
    parameters.add_int(
        "target_liquid_height",
        "target_liquid_height",
        default=45,
        minimum=1,
        maximum=60,
        description="Height of the liquid column in mm.",
    )
    parameters.add_str(
        variable_name="collar",
        display_name="Vacuum Collar",
        description="The kind of Collar(Opentrons or Millipore)",
        default="millipore_vacuum_manifold_collar_short",
        choices=[
            {
                "display_name": "Opentrons: Short",
                "value": "opentrons_vacuum_manifold_collar_short",
            },
            {
                "display_name": "Opentrons: Tall",
                "value": "opentrons_vacuum_manifold_collar_tall",
            },
            {
                "display_name": "Millipore: Short",
                "value": "millipore_vacuum_manifold_collar_short",
            },
            {
                "display_name": "Millipore: Tall",
                "value": "millipore_vacuum_manifold_collar_tall",
            },
        ]
    )


def find_port_by_id(vendorId: int, productId: int) -> str:
    """Find a serial port by USB vendor and product ID."""
    ports = serial.tools.list_ports.comports()
    for port in ports:
        if port.vid == vendorId and port.pid == productId:
            return port.device
    return ""


def _write_to_csv(
    f_name: str, header_write: bool, timestamp: float, data: Dict
) -> None:
    """Append a data line to the CSV file (offloaded to a thread).

    Expects `data` to have at least 4 numeric elements: [PA_FILTERED, PA_RAW, PB_FILTERED, PB_RAW].
    Adds the current `pressure_set` as the last column (may be None).
    """
    with open(f_name, "a", newline="") as f:
        writer = csv.writer(f)
        if header_write:
            writer.writerow(
                [
                    "Time(s)",
                    "target_gauge_pressure",
                    "current_gauge_pressure",
                    "pressure_abs_a",
                    "pressure_abs_b",
                    "pressure_atm",
                    "vacuum_enabled",
                    "vent_state",
                ]
            )
        writer.writerow(
            [
                f"{timestamp:.2f}",
                f"{data['target_gauge_pressure']}",
                f"{data['current_gauge_pressure']}",
                f"{data['pressure_abs_a']}",
                f"{data['pressure_abs_b']}",
                f"{data['pressure_atm']}",
                f"{data['vacuum_enabled']}",
                f"{data['vent_state']}",
            ]
        )
    f.close()


def read_continuous_data(
    f_name: str,
    pump: VacuumModuleContext,
    start_time: float,
    run_time: float,
    ctx: protocol_api.ProtocolContext,
) -> None:
    """Read and print continuous data from the vacuum pump for the specified timeout duration."""
    loop_st = time.perf_counter()
    head_writer = True
    while time.perf_counter() - loop_st < run_time:
        line = get_vacuum_read(pump)
        # ctx.delay(seconds=0.1)  # Adjust the delay as needed
        pressure_dict = dataclasses.asdict(line)
        # Timestamp
        ts = time.perf_counter() - start_time
        # ctx.comment(f"Pump time: {time.perf_counter() - loop_st}")
        # Record Pressure Data
        _write_to_csv(f_name, head_writer, ts, pressure_dict)
        head_writer = False


def read_data(
    f_name: str,
    pump: VacuumModuleContext,
    start_time: float,
    duration: int,
    ctx: protocol_api.ProtocolContext,
) -> None:
    """Run continuous data read and handle expected timeout and errors."""
    try:
        read_continuous_data(f_name, pump, start_time, duration, ctx)
    except Exception as e:
        ctx.comment(f"continuous read error: {e}")
        raise


def setup_devices() -> Any:
    from hardware_testing.drivers import vacuum_pump
    # Arduino Water pump Driver
    m_port = find_port_by_id(Ard_idVendor, Ard_idProduct)

    pump_fixture = vacuum_pump.WaterPump.create(
        port=m_port, baudrate=115200
    )

    return pump_fixture


def run_single_pump_api_cycle(
    vm_mod: VacuumModuleContext,
    water_pump_fixture: Any,
    target_pressure: int,
    target_liquid_height: int,
    cycle_index: int,
    output_dir: Path,
    SETTLE_SEC: int,
    RUN_SEC: int,
    DECAY_SEC: int,
    VENT_SEC: int,
    ctx: protocol_api.ProtocolContext,
) -> None:
    """Run one pump cycle for RUN_SEC seconds using the driver's continuous reader."""
    #------------------------Fill the water reservoirt---------------------------------
    # Start the water pump to fill the reservoir to the target liquid height
    water_pump_fixture.open_solenoid()
    water_pump_fixture.reset_sensor()  # Reset the capacitive sensor before starting
    water_pump_fixture.flush_buffer(20)  # Flush the serial input buffer before starting
    try:
        # ctx.delay(0.1) # Short delay to ensure the sensor is reset
        # Start the filling of the water pump while the vacuum is running
        water_reached = water_pump_fixture.water_fill_auto(target_liquid_height)
        ctx.comment(f"[cycle {cycle_index}] water fill reached target: {water_reached}")
    except Exception as e:
        ctx.comment(f"[cycle {cycle_index}] water fill error: {e}")
        raise
    water_pump_fixture.close_solenoid()
    ctx.delay(seconds=1)
    #------------------------Start the vacuum pump cycle---------------------------------
    # Set Pressure and Vacuum to target for x amount of time.
    vm_mod.start_set_vacuum_pressure(
        gauge_pressure_mbar=target_pressure,
    )
    ctx.comment(f"[cycle {cycle_index}] pump started at target {target_pressure} mbar")
    # Dynamic CSV naming per trial (date + trial index + pressure)
    date_str = datetime.utcnow().strftime("%y_%m_%d_%H_%M_%S")
    output_dir.mkdir(parents=True, exist_ok=True)
    ctx.comment(f"output_dir: {output_dir}")
    trial_csv = (
        output_dir / f"PressureData_{date_str}_trial_{cycle_index:02d}_{ctx.params.pressure}mbar.csv"
    )
    ctx.comment(f"[cycle {cycle_index}] logging to {trial_csv}")
    # Run the continuous data reader for RUN_SEC seconds.
    start_time = time.perf_counter()
    try:
        read_data(str(trial_csv), vm_mod, start_time, SETTLE_SEC+RUN_SEC, ctx)
    except Exception as e:
        ctx.comment(f"[cycle {cycle_index}] ERROR during continuous read: {e}")
        raise
    ctx.comment(
        f"[cycle {cycle_index}] continuous read duration reached ({RUN_SEC}s)"
    )
    # Stop the pump
    vm_mod.stop_vacuum_pump()
    # Vent the pump system to atmospheric pressure while pump is on
    vm_mod.open_vent(equalize_timeout_s=VENT_SEC)
    try:
        read_data(str(trial_csv), vm_mod, start_time, DECAY_SEC, ctx)
    except Exception as e:
        ctx.comment(f"[cycle {cycle_index}] ERROR during decay read: {e}")
        raise
    # Close Vent
    ctx.comment(f"[cycle {cycle_index}] pump stopped; decaying for {DECAY_SEC}s")
    vm_mod.close_vent()

def confirm_position(ctx: protocol_api.ProtocolContext) -> None:
    """Pause the protocol if enable_position_confirm is True."""
    if ctx.params.enable_position_confirm:  # type: ignore[attr-defined]
        ctx.pause("Checking pipette position above well.")

def get_vacuum_read(vm_mod: VacuumModuleContext) -> Any:
    """Hack: send M127 E0 via the driver. Not part of public PAPI."""
    core = cast(VacuumModuleCore, vm_mod._core)
    adapter = core._sync_module_hardware
    vacuum_hw = object.__getattribute__(adapter, "_obj_to_adapt")

    data = vacuum_hw.vacuum_state
    time.sleep(0.1)
    return data


def enable_waste_detection(vm_mod: VacuumModuleContext, enable: bool = False) -> None:
    """Hack: send M127 E0 via the driver. Not part of public PAPI."""
    core = cast(VacuumModuleCore, vm_mod._core)
    adapter = core._sync_module_hardware
    vacuum_hw = object.__getattribute__(adapter, "_obj_to_adapt")
    driver = vacuum_hw._driver

    SynchronousAdapter.call_coroutine_sync(
        vacuum_hw._loop,
        driver.set_waste_configs,
        enable_waste_full_detection=enable,
    )

def set_tunings(vm_mod: VacuumModuleContext, kp: float, ki: float, kd: float) -> None:
    """Set the PID tunings on the vacuum module via the driver. Not part of public PAPI."""
    core = cast(VacuumModuleCore, vm_mod._core)
    adapter = core._sync_module_hardware
    vacuum_hw = object.__getattribute__(adapter, "_obj_to_adapt")
    driver = vacuum_hw._driver

    SynchronousAdapter.call_coroutine_sync(
        vacuum_hw._loop,
        driver.set_pressure_control_tunings,
        kp=kp,
        ki=ki,
        kd=kd,
    )

def run(ctx: protocol_api.ProtocolContext) -> None:
    """Execute the vacuum manifold stress test protocol."""
    z_offset = ctx.params.z_offset  # type: ignore[attr-defined]
    volume = ctx.params.volume  # type: ignore[attr-defined]
    cycles = ctx.params.cycles  # type: ignore[attr-defined]
    pressure = -1*(ctx.params.pressure)  # type: ignore[attr-defined]
    SETTLE_SEC = ctx.params.vm_settle_sec  # type: ignore[attr-defined]
    RUN_SEC = ctx.params.vm_run_sec  # type: ignore[attr-defined]
    DECAY_SEC = ctx.params.vm_decay_sec  # type: ignore[attr-defined]
    VENT_SEC = ctx.params.vm_vent_sec  # type: ignore[attr-defined]
    target_liquid_height = ctx.params.target_liquid_height  # type: ignore[attr-defined]
    
    # Load Trash Bin
    ctx.load_trash_bin("A1")
    # Load Vacuum Module
    vm_mod = cast(VacuumModuleContext, ctx.load_module("vacuumModuleV1", "A3"))
    # Set the target liquid height for the water reservoir
    # Load Labware
    tip_rack = ctx.load_labware(
        "opentrons_flex_96_tiprack_1000uL",
        "B2",
        adapter="opentrons_flex_96_tiprack_adapter",
    )
    manifold_collar = vm_mod.load_adapter_to_dock(ctx.params.collar)  # type: ignore[attr-defined]
    filter_plate = manifold_collar.load_labware("invitroven_filter_plate")
    source = ctx.load_labware("nest_1_reservoir_290ml", "C1")
    source.set_offset(x=0, y=0, z=8)
    tip_rack.set_offset(x=0, y=0, z=0)
    # Load Pipette
    pip = ctx.load_instrument("flex_96channel_1000", "left", tip_racks=[tip_rack])
    pump_fixture = None
    # Setup the water pump fixture
    if not ctx.is_simulating():
        try:
            pump_fixture = setup_devices()
        except Exception as e:
            ctx.comment(f"Pump init failed: {e}")
            raise
    # Disable waste Detection to avoid false positives during the stress test
    enable_waste_detection(vm_mod, False)  # type: ignore[attr-defined]
    kp = 17.03  # type: ignore[attr-defined]
    ki = 5.38  # type: ignore[attr-defined]
    kd = 0.15  # type: ignore[attr-defined]
    set_tunings(vm_mod, kp, ki, kd)  # type: ignore[attr-defined]
    ctx.move_labware(manifold_collar, vm_mod, use_gripper=True)
    pip.pick_up_tip()
    output_dir = Path(OUTPUT_DIR)
    for cycle in range(1, cycles + 1):
        ctx.comment(f"=== Cycle :{cycle}/{cycles}===")
        pip.aspirate(volume, source["A1"].bottom(ASPIRATE_OFFSET_MM))
        pip.dispense(volume, filter_plate["A1"].top(z_offset), push_out=50)
        # pip.touch_tip(filter_plate["A1"], v_offset=z_offset)
        pip.move_to(filter_plate["A1"].top(30))  # Move away again
        if not ctx.is_simulating():
            run_single_pump_api_cycle(
                vm_mod,
                pump_fixture,
                pressure,
                target_liquid_height,
                cycle,
                output_dir,
                SETTLE_SEC,
                RUN_SEC,
                DECAY_SEC,
                VENT_SEC,
                ctx,
            )
    pip.return_tip()
    if not ctx.is_simulating():
        try:
            if pump_fixture is not None:
                pump_fixture.disconnect()
        except Exception:
            raise
