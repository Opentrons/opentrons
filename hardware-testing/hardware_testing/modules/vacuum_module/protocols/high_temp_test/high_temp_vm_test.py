"""Vacuum Module High Humidity / Temp Test."""

import asyncio
from datetime import datetime
from pathlib import Path
from opentrons import protocol_api  # type: ignore[import]
from opentrons.protocol_api import ParameterContext
from opentrons.drivers import vacuum_module  # type: ignore[import]

metadata = {"protocolName": "VM 400mbar Stress Test-water pump impl"}
requirements = {"robotType": "Flex", "apiLevel": "2.31"}

Ard_idVendor = 9025
Ard_idProduct = 66
VM_idVendor = 1155
VM_idProduct = 61248
SETTLE_SEC = 21
RUN_SEC = 60 * 2
DECAY_SEC = 25
VENT_SEC = 5
ASPIRATE_OFFSET_MM = 5
DISPENSE_OFFSET_MM = 8

OUTPUT_DIR = "/data/vm_test/"


def add_parameters(parameters: ParameterContext) -> None:
    """Protocol Parameters."""
    parameters.add_int(
        display_name="cycles",
        variable_name="cycles",
        default=40,
        minimum=1,
        maximum=1042,
        description="Number of liquid + vacuum cycles",
    )
    parameters.add_int(
        display_name="pressure",
        variable_name="pressure",
        default=400,
        minimum=200,
        maximum=800,
        description="Target absolute pressure (mbar)",
    )
    parameters.add_int(
        "volume",
        "volume",
        default=1000,
        minimum=1,
        maximum=1000,
        description="Aspirate Volume",
    )
    parameters.add_bool(
        "run pump",
        "run_pump",
        default=True,
        description="Enable vacuum pump operations",
    )
    parameters.add_int(
        "offset",
        "offset",
        default=8,
        minimum=-100,
        maximum=100,
        description="Z offset for the acroprep or labware",
    )
    parameters.add_int(
        "tough_fill_time",
        "trough_fill_time",
        default=87,
        minimum=1,
        maximum=120,
        description="Reservoir water fill time",
    )


async def water_pump_timer(w_pump, run_time: int) -> None:  # noqa: ANN001
    """Timer."""
    await w_pump.turn_motor_on()
    await asyncio.sleep(run_time)
    await w_pump.turn_motor_off()


async def _run_single_pump_api_cycle(
    pump,  # noqa: ANN001
    water_pump_fixture,  # noqa: ANN001
    target_pressure: int,
    trough_fill_time: int,
    cycle_index: int,
    output_dir: Path,
    ctx: protocol_api.ProtocolContext,
) -> None:
    """Run one pump cycle for RUN_SEC seconds using the driver's continuous reader.

    Relies on the driver's internal CSV logging (e.g. pump_test.csv) instead of
    creating a per-cycle CSV here.
    """
    target_to_pump = target_pressure - 1023
    # Start the filling of the water pump while the vacuum is running
    asyncio.create_task(water_pump_timer(water_pump_fixture, trough_fill_time))
    # Set Pressure and Vacuum to target for x amount of time.
    await pump.set_vacuum_state(
        enable_vacuum=True,
        gauge_pressure_mbar=target_to_pump,
        duration=None,
    )

    await asyncio.sleep(SETTLE_SEC)
    ctx.comment(f"[cycle {cycle_index}] pump started at target {target_pressure} mbar")

    # Dynamic CSV naming per trial (date + trial index + pressure)
    date_str = datetime.utcnow().strftime("%y-%m-%d %H:%M:%S")
    if not ctx.is_simulating():
        output_dir.mkdir(parents=True, exist_ok=True)
    print(f"output_dir: {output_dir}")
    trial_csv = (
        output_dir / f"{date_str}_trial_{cycle_index:02d}_{target_pressure}mbar.csv"
    )
    try:
        pump.set_csv_filename(str(trial_csv))
        ctx.comment(f"[cycle {cycle_index}] logging to {trial_csv.name}")
    except Exception as e:
        ctx.comment(f"[cycle {cycle_index}] failed to set CSV filename: {e}")
    # Run the continuous data reader for RUN_SEC seconds.
    try:
        await pump.read_continuous_data(RUN_SEC)
    except asyncio.TimeoutError:
        # Expected: we stop after RUN_SEC
        ctx.comment(
            f"[cycle {cycle_index}] continuous read duration reached ({RUN_SEC}s)"
        )
    except Exception as e:
        ctx.comment(f"[cycle {cycle_index}] continuous read error: {e}")

    # Vent the pump system to atmospheric pressure while pump is on
    await pump.set_vent_state(False)
    await asyncio.sleep(VENT_SEC)
    # Stop the pump
    await pump.set_vacuum_state(
        enable_vacuum=False,
        gauge_pressure_mbar=target_to_pump,
        duration=None,
    )
    # Close Vent
    ctx.comment(f"[cycle {cycle_index}] pump stopped; decaying for {DECAY_SEC}s")
    await asyncio.sleep(DECAY_SEC)
    await pump.set_vent_state(True)


def run(ctx: protocol_api.ProtocolContext) -> None:
    """Main entry point."""
    z_offset = ctx.params.offset  # type: ignore[attr-defined]
    volume = ctx.params.volume  # type: ignore[attr-defined]
    water_pump = ctx.params.run_pump  # type: ignore[attr-defined]
    cycles = ctx.params.cycles  # type: ignore[attr-defined]
    pressure = ctx.params.pressure  # type: ignore[attr-defined]
    trough_fill_time = ctx.params.trough_fill_time  # type: ignore[attr-defined]
    output_dir = Path(OUTPUT_DIR)

    if not ctx.is_simulating():
        output_dir.mkdir(parents=True, exist_ok=True)

        if water_pump:
            from hardware_testing.modules.common.utils import find_module_port
            from hardware_testing.drivers import vacuum_pump

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

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    pump: vacuum_module.VacuumModuleDriver
    pump_fixture = None
    if not ctx.is_simulating():
        try:
            vm_port = find_module_port(VM_idVendor, VM_idProduct)
            pump = loop.run_until_complete(
                vacuum_module.VacuumModuleDriver.create(port=vm_port, loop=loop)
            )
            if water_pump:
                ard_port = find_module_port(Ard_idVendor, Ard_idProduct)
                # Arduino Water pump Driver
                pump_fixture = loop.run_until_complete(
                    vacuum_pump.WaterPump.create(
                        port=ard_port, baudrate=115200, loop=loop
                    )
                )
                loop.run_until_complete(pump_fixture.connect())
            ctx.comment("Pump connected.")
        except Exception as e:
            ctx.comment(f"Pump init failed: {e}")
            return

    pip.pick_up_tip()

    for cycle in range(1, cycles + 1):
        ctx.comment(f"=== Cycle {cycle}/{cycles} ===")
        pip.aspirate(volume, source["A1"].bottom(ASPIRATE_OFFSET_MM))
        pip.dispense(volume, filter_plate["A1"].top(z_offset), push_out=50)
        pip.move_to(filter_plate["A1"].top(10))
        if not ctx.is_simulating():
            loop.run_until_complete(
                _run_single_pump_api_cycle(
                    pump,
                    pump_fixture,
                    trough_fill_time,
                    pressure,
                    cycle,
                    output_dir,
                    ctx,
                )
            )
    pip.return_tip()
    if not ctx.is_simulating():
        loop.run_until_complete(pump.disconnect())
        ctx.comment("Pump disconnected.")
    loop.close()
