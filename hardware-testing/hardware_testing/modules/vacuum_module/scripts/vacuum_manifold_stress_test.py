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
from opentrons.hardware_control.ot3api import OT3API  # type: ignore[import]
import dataclasses
import time
import traceback
import csv
from typing import Dict


metadata = {"protocolName": "VM 200mbar Stress Test-water pump impl"}
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
        default=200,
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
        default=360,
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
    parameters.add_int(
        "perstaltic_flow_rate",
        "perstaltic_flow_rate",
        default=89,
        minimum=1,
        maximum=400,
        description="Reservoir water fill time.",
    )


def find_port_by_id(vendorId: int, productId: int) -> str:
    """Find a serial port by USB vendor and product ID."""
    ports = serial.tools.list_ports.comports()
    for port in ports:
        # ctx.comment(f"port_vid: {port.vid}, port_pid: {port.pid}")
        if port.vid == vendorId and port.pid == productId:
            # ctx.comment(f"port: {port.device}")
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


async def _read_continuous_data(
    self: OT3API,
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
            # ctx.comment(f"Pump time: {time.perf_counter() - loop_st}")
            # Record Pressure Data
            _write_to_csv(f_name, head_writer, ts, pressure_dict)
            head_writer = False
    except Exception as e:
        raise (e)


async def _read_data(
    self: OT3API,
    f_name: str,
    pump: vacuum_module.VacuumModuleDriver,
    start_time: float,
    duration: int,
    ctx: protocol_api.ProtocolContext,
) -> None:
    """Run continuous data read and handle expected timeout and errors."""
    try:
        await self.read_continuous_data(f_name, pump, start_time, duration, ctx)  # type: ignore[attr-defined]
    except asyncio.TimeoutError:
        # Expected: we stop after RUN_SEC
        ctx.comment(f"continuous read duration reached ({duration}s)")
    except Exception as e:
        ctx.comment(f"continuous read error: {e}")
        raise


async def _setup_devices(
    self: OT3API,
) -> tuple[vacuum_module.VacuumModuleDriver, Any]:
    from hardware_testing.drivers import vacuum_pump

    loop = asyncio.get_event_loop()
    # Vacuum Manifold Driver
    port = find_port_by_id(VM_idVendor, VM_idProduct)
    pump = await vacuum_module.VacuumModuleDriver.create(port=port, loop=self._loop)
    await pump.set_waste_configs(False)
    # Arduino Water pump Driver
    m_port = find_port_by_id(Ard_idVendor, Ard_idProduct)

    pump_fixture = await vacuum_pump.WaterPump.create(
        port=m_port, baudrate=115200, loop=loop
    )

    return pump, pump_fixture


async def _run_single_pump_api_cycle(
    self: OT3API,
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
    target_to_pump = target_pressure - 1013.25
    await pump.set_vent_state(VentState.OPENED)
    # Start the filling of the water pump while the vacuum is running
    await water_pump_fixture.water_fill_timer(trough_fill_time)
    await pump.set_vent_state(VentState.CLOSED)
    await asyncio.sleep(1)
    # Set Pressure and Vacuum to target for x amount of time.
    await pump.set_vacuum_state(
        enable_vacuum=True,
        gauge_pressure_mbar=target_to_pump,
    )
    ctx.comment(f"[cycle {cycle_index}] pump started at target {target_pressure} mbar")

    # Dynamic CSV naming per trial (date + trial index + pressure)
    date_str = datetime.utcnow().strftime("%y-%m-%d_%H:%M:%S")
    output_dir.mkdir(parents=True, exist_ok=True)
    # ctx.comment(f"output_dir: {output_dir}")
    trial_csv = (
        output_dir / f"{date_str}_trial_{cycle_index:02d}_{target_pressure}mbar.csv"
    )
    ctx.comment(f"[cycle {cycle_index}] logging to {trial_csv}")
    # Run the continuous data reader for RUN_SEC seconds.
    start_time = time.perf_counter()
    try:
        await self.read_data(str(trial_csv), pump, start_time, SETTLE_SEC + RUN_SEC, ctx)  # type: ignore[attr-defined]
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
        await self.read_data(str(trial_csv), pump, start_time, DECAY_SEC, ctx)  # type: ignore[attr-defined]
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


async def _pump_disconnect(self: OT3API, pump: Any) -> None:
    await pump.disconnect()


def run(ctx: protocol_api.ProtocolContext) -> None:
    """Execute the vacuum manifold stress test protocol."""
    if not ctx.is_simulating():
        OT3API.read_continuous_data = _read_continuous_data  # type: ignore[attr-defined]
        OT3API.read_data = _read_data  # type: ignore[attr-defined]
        OT3API.run_single_pump_api_cycle = _run_single_pump_api_cycle  # type: ignore[attr-defined]
        OT3API.setup_devices = _setup_devices  # type: ignore[attr-defined]
        OT3API.pump_disconnect = _pump_disconnect  # type: ignore[attr-defined]

    z_offset = ctx.params.z_offset  # type: ignore[attr-defined]
    volume = ctx.params.volume  # type: ignore[attr-defined]
    cycles = ctx.params.cycles  # type: ignore[attr-defined]
    pressure = ctx.params.pressure  # type: ignore[attr-defined]
    SETTLE_SEC = ctx.params.vm_settle_sec  # type: ignore[attr-defined]
    RUN_SEC = ctx.params.vm_run_sec  # type: ignore[attr-defined]
    DECAY_SEC = ctx.params.vm_decay_sec  # type: ignore[attr-defined]
    VENT_SEC = ctx.params.vm_vent_sec  # type: ignore[attr-defined]
    perstaltic_volume_target = ctx.params.perstaltic_target_volume  # type: ignore[attr-defined]
    perstaltic_pump_flow_rate = ctx.params.perstaltic_flow_rate  # type: ignore[attr-defined]
    conversion = (
        (perstaltic_volume_target / 1000) / perstaltic_pump_flow_rate
    ) * 60  # Convert uL volume to pump fill time (seconds)
    perstaltic_time = int(conversion)

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

    pump = None
    pump_fixture = None
    if not ctx.is_simulating():
        ot3api = ctx._core.get_hardware()
        try:
            pump, pump_fixture = ot3api.setup_devices()  # type: ignore[attr-defined]
        except Exception as e:
            ctx.comment(f"Pump init failed: {e}")
            raise

    pip.pick_up_tip()

    output_dir = Path(OUTPUT_DIR)
    if not ctx.is_simulating():
        assert pump is not None
        for cycle in range(1, cycles + 1):
            ctx.comment(f"=== Cycle :{cycle}/{cycles}===")
            pip.aspirate(volume, source["A1"].bottom(ASPIRATE_OFFSET_MM))
            pip.dispense(volume, filter_plate["A1"].top(z_offset), push_out=50)
            # pip.touch_tip(filter_plate["A1"], v_offset=z_offset)
            pip.move_to(filter_plate["A1"].top(10))  # Move away again
            ot3api = ctx._core.get_hardware()
            try:
                ot3api.run_single_pump_api_cycle(
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
            except Exception as e:
                tb = traceback.format_exc()
                ctx.comment(f"[cycle {cycle}] failed ({type(e).__name__}: {e})\n{tb}")
                raise
        pip.return_tip()
    if not ctx.is_simulating():
        try:
            if pump is not None:
                ot3api.pump_disconnect(pump)
            if pump_fixture is not None:
                ot3api.pump_disconnect(pump_fixture)
        except Exception:
            raise
