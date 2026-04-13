"""Vacuum manifold 400mbar stress test protocol for the Opentrons Flex."""
import asyncio
from typing import Any
from datetime import datetime
from pathlib import Path
from opentrons import protocol_api  # type: ignore[import]
from opentrons.protocol_api import ParameterContext
import serial.tools.list_ports  # type: ignore[import]
from opentrons.drivers import vacuum_module
from opentrons.drivers.vacuum_module.types import VentState
import dataclasses
import time
import logging
import traceback
import csv
from typing import Dict


metadata = {"protocolName": "VM 400mbar Stress Test-water pump impl"}
requirements = {"robotType": "Flex", "apiLevel": "2.26"}

# Tunables (can move some to parameters)
ASPIRATE_OFFSET_MM = 5
# Dispense_offset_mm = 8 for the 96 deep well
# -20 is acroprep
DISPENSE_OFFSET_MM = 8

OUTPUT_DIR = "/data/vacuum_manifold_life_test_evt_v1.1/"

Ard_idVendor = 9025
Ard_idProduct = 32858

VM_idVendor = 1155
VM_idProduct = 61248


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
        default=400,
        minimum=200,
        maximum=800,
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
        default=8,
        minimum=-100,
        maximum=100,
        description="Z offset for the acroprep or labware.",
    )
    parameters.add_int(
        "vm_run_sec",
        "vm_run_sec",
        default=120,
        minimum=1,
        maximum=1000,
        description="Amount of time to hold steady pressure.",
    )
    parameters.add_int(
        "vm_settle_sec",
        "vm_settle_sec",
        default=21,
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
        "perstaltic_target_volume",
        "perstaltic_target_volume",
        default=96000,
        minimum=1,
        maximum=96000,
        description="Reservoir water fill time.",
    )


async def find_port_by_id(vendorId: int, productId: int) -> str:
    """Find a serial port by USB vendor and product ID."""
    ports = serial.tools.list_ports.comports()
    for port in ports:
        print(f"port_vid: {port.vid}, port_pid: {port.pid}")
        if port.vid == vendorId and port.pid == productId:
            print(f"port: {port.device}")
            return port.device
    return ""


async def _write_to_csv(
    f_name: str, header_write: bool, timestamp: float, data: Dict
) -> None:
    """Append a data line to the CSV file (offloaded to a thread).

    Expects `data` to have at least 4 numeric elements: [PA_FILTERED, PA_RAW, PB_FILTERED, PB_RAW].
    Adds the current `pressure_set` as the last column (may be None).
    """

    def _append() -> None:
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

    await asyncio.to_thread(_append)


async def read_continuous_data(
    f_name: str,
    pump: vacuum_module.VacuumModuleDriver,
    start_time: float,
    run_time: float,
    ctx: protocol_api.ProtocolContext,
) -> None:
    """Read and print continuous data from the vacuum pump for the specified timeout duration."""
    loop_st = time.perf_counter()
    head_writer = True
    try:
        while time.perf_counter() - loop_st < run_time:
            line = await pump.get_vacuum_state()
            await asyncio.sleep(0.1)
            pressure_dict = dataclasses.asdict(line)
            # Timestamp
            ts = time.perf_counter() - start_time
            ctx.comment(f"Pump time: {time.perf_counter() - loop_st}")
            # Record Pressure Data
            await _write_to_csv(f_name, head_writer, ts, pressure_dict)
            head_writer = False
    except Exception as e:
        raise (e)


async def read_data(
    f_name: str,
    pump: vacuum_module.VacuumModuleDriver,
    start_time: float,
    duration: int,
    ctx: protocol_api.ProtocolContext,
) -> None:
    """Run continuous data read and handle expected timeout and errors."""
    try:
        await read_continuous_data(f_name, pump, start_time, duration, ctx)
    except asyncio.TimeoutError:
        # Expected: we stop after RUN_SEC
        logging.info(f"continuous read duration reached ({duration}s)")
    except Exception as e:
        logging.error(f"continuous read error: {e}")
        raise


async def _setup_devices() -> tuple:  # type: ignore[type-arg]
    from hardware_testing.drivers import vacuum_pump

    loop = asyncio.get_event_loop()
    # Vacuum Manifold Driver
    port = await find_port_by_id(VM_idVendor, VM_idProduct)
    pump = await vacuum_module.VacuumModuleDriver.create(port=port, loop=loop)

    # Arduino Water pump Driver
    m_port = await find_port_by_id(Ard_idVendor, Ard_idProduct)

    pump_fixture = await vacuum_pump.WaterPump.create(
        port=m_port, baudrate=115200, loop=loop
    )

    return pump, pump_fixture


async def _run_single_pump_api_cycle(
    pump: vacuum_module.VacuumModuleDriver,
    water_pump_fixture: Any,
    target_pressure: int,
    trough_fill_time: int,
    cycle_index: int,
    output_dir: Path,
    SETTLE_SEC: int,
    RUN_SEC: int,
    DECAY_SEC: int,
    VENT_SEC: int,
    ctx: protocol_api.ProtocolContext,
) -> None:
    """Run one pump cycle for RUN_SEC seconds using the driver's continuous reader."""
    target_to_pump = target_pressure - 1023
    # Start the filling of the water pump while the vacuum is running
    await water_pump_fixture.water_fill_timer(trough_fill_time)
    # Set Pressure and Vacuum to target for x amount of time.
    await pump.set_vacuum_state(
        enable_vacuum=True,
        gauge_pressure_mbar=target_to_pump,
    )
    ctx.comment(f"[cycle {cycle_index}] pump started at target {target_pressure} mbar")

    # Dynamic CSV naming per trial (date + trial index + pressure)
    date_str = datetime.utcnow().strftime("%y-%m-%d_%H:%M:%S")
    output_dir.mkdir(parents=True, exist_ok=True)
    ctx.comment(f"output_dir: {output_dir}")
    trial_csv = (
        output_dir / f"{date_str}_trial_{cycle_index:02d}_{target_pressure}mbar.csv"
    )
    ctx.comment(f"[cycle {cycle_index}] logging to {trial_csv}")
    # Run the continuous data reader for RUN_SEC seconds.
    start_time = time.perf_counter()
    try:
        await read_data(str(trial_csv), pump, start_time, SETTLE_SEC + RUN_SEC, ctx)
    except asyncio.TimeoutError:
        ctx.comment(
            f"[cycle {cycle_index}] continuous read duration reached ({SETTLE_SEC+RUN_SEC}s)"
        )
    except Exception as e:
        ctx.comment(f"[cycle {cycle_index}] ERROR during data read: {e}")
        raise
    ctx.comment(
        f"[cycle {cycle_index}] continuous read duration reached ({SETTLE_SEC+RUN_SEC}s)"
    )
    # Stop the pump
    await pump.set_vacuum_state(
        enable_vacuum=False,
        gauge_pressure_mbar=target_to_pump,
    )
    # Vent the pump system to atmospheric pressure while pump is on
    await pump.set_vent_state(VentState.OPENED)
    await asyncio.sleep(VENT_SEC)
    try:
        await read_data(str(trial_csv), pump, start_time, DECAY_SEC, ctx)
    except asyncio.TimeoutError:
        ctx.comment(
            f"[cycle {cycle_index}] continuous read duration reached ({DECAY_SEC}s)"
        )
    except Exception as e:
        ctx.comment(f"[cycle {cycle_index}] ERROR during decay read: {e}")
        raise
    # Close Vent
    ctx.comment(f"[cycle {cycle_index}] pump stopped; decaying for {DECAY_SEC}s")
    await asyncio.sleep(DECAY_SEC)
    await pump.set_vent_state(VentState.CLOSED)


def run(ctx: protocol_api.ProtocolContext) -> None:
    """Execute the vacuum manifold stress test protocol."""
    z_offset = ctx.params.z_offset  # type: ignore[attr-defined]
    volume = ctx.params.volume  # type: ignore[attr-defined]
    cycles = ctx.params.cycles  # type: ignore[attr-defined]
    pressure = ctx.params.pressure  # type: ignore[attr-defined]
    SETTLE_SEC = ctx.params.vm_settle_sec  # type: ignore[attr-defined]
    RUN_SEC = ctx.params.vm_run_sec  # type: ignore[attr-defined]
    DECAY_SEC = ctx.params.vm_decay_sec  # type: ignore[attr-defined]
    VENT_SEC = ctx.params.vm_vent_sec  # type: ignore[attr-defined]
    perstaltic_volume_target = ctx.params.perstaltic_target_volume  # type: ignore[attr-defined]
    perstaltic_pump_flow_rate = 100  # mL/min
    water_tolerance = 5
    perstaltic_time = (
        int(perstaltic_volume_target / perstaltic_pump_flow_rate) + water_tolerance
    )

    ctx.load_trash_bin("A3")
    tips = ctx.load_labware(
        "opentrons_flex_96_tiprack_1000uL",
        "B2",
        adapter="opentrons_flex_96_tiprack_adapter",
    )
    pip = ctx.load_instrument("flex_96channel_1000", "left", tip_racks=[tips])
    source = ctx.load_labware("nest_1_reservoir_290ml", "B3")
    base = ctx.load_labware("millipore_vacuum_manifold_base", "C3")
    manifold_collar = base.load_labware("millipore_vacuum_manifold_collar_standard")
    filter_plate = manifold_collar.load_labware("attractspe_c18_filter_plate")

    pip.pick_up_tip()

    pump = None
    pump_fixture = None
    loop = None
    if not ctx.is_simulating():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            pump, pump_fixture = loop.run_until_complete(_setup_devices())
        except Exception as e:
            ctx.comment(f"Pump init failed: {e}")

    output_dir = Path(OUTPUT_DIR)
    if not ctx.is_simulating():
        assert loop is not None
        assert pump is not None
        for cycle in range(1, cycles + 1):
            ctx.comment(f"=== Cycle :{cycle}/{cycles}===")
            pip.aspirate(volume, source["A1"].bottom(ASPIRATE_OFFSET_MM))
            pip.dispense(volume, filter_plate["A1"].top(z_offset), push_out=50)
            # pip.touch_tip(filter_plate["A1"], v_offset=z_offset)
            pip.move_to(filter_plate["A1"].top(10))  # Move away again
            try:
                loop.run_until_complete(
                    _run_single_pump_api_cycle(
                        pump,
                        pump_fixture,
                        pressure,
                        perstaltic_time,
                        cycle,
                        output_dir,
                        SETTLE_SEC,
                        RUN_SEC,
                        DECAY_SEC,
                        VENT_SEC,
                        ctx,
                    )
                )
            except Exception as e:
                tb = traceback.format_exc()
                ctx.comment(f"[cycle {cycle}] failed ({type(e).__name__}: {e})\n{tb}")
                raise
        pip.return_tip()
    if not ctx.is_simulating() and loop is not None:
        try:
            if pump is not None:
                loop.run_until_complete(pump.disconnect())
            if pump_fixture is not None:
                loop.run_until_complete(pump_fixture.disconnect())
        except Exception:
            raise
        loop.close()
