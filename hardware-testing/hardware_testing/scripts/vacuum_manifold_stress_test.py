import asyncio
import time
from datetime import datetime
from pathlib import Path
from opentrons import protocol_api
import os

metadata = {"protocolName": "VM 400mbar Stress Test-water pump impl"}
requirements = {"robotType": "Flex", "apiLevel": "2.26"}

# Tunables (can move some to parameters)
SETTLE_SEC = 21
RUN_SEC = 60*2
DECAY_SEC = 25
VENT_SEC = 5
ASPIRATE_OFFSET_MM = 5
# Dispense_offset_mm = 8 for the 96 deep well
# -20 is acroprep
DISPENSE_OFFSET_MM = 8

OUTPUT_DIR = "/data/vacuum_manifold_life_test_Brayans_FW/"

def add_parameters(parameters):
    parameters.add_int("cycles", "cycles", default=40, minimum=1, maximum=1042,
                       description="Number of liquid + vacuum cycles")
    parameters.add_int("pressure", "pressure", default=400, minimum=200, maximum=800,
                       description="Target absolute pressure (mbar)")
    parameters.add_int("volume", "volume", default=1000, minimum=1, maximum=1000,
                       description="Aspirate Volume")
    parameters.add_bool("run pump", "run_pump", default=True,
                        description="Enable vacuum pump operations")
    parameters.add_float("sample interval (s)", "sample_interval",
                         default=0.1, minimum=0.1, maximum=5.0,
                         description="Pressure sampling interval during pump run")
    parameters.add_str(
                        "port",
                        "vacuum_port",
                        description="Pick the port that it's connnected too",
                        choices=[{
                            "display_name": "/dev/ttyACM1",
                            "value": "/dev/ttyACM1",
                            },
                            {
                            "display_name": "/dev/ttyACM2",
                            "value": "/dev/ttyACM2",
                            },
                            {
                            "display_name": "/dev/ttyACM3",
                            "value": "/dev/ttyACM3",
                            },
                            ],
                        default="/dev/ttyACM1"
                    )
    parameters.add_str(
                        "Driver",
                        "driver_select",
                        description="Pick the driver that the manifold would be using",
                        choices=[{
                            "display_name": "api",
                            "value": "api",
                            },
                            {
                            "display_name": "carlos",
                            "value": "carlos",
                            }
                            ],
                            default="api"
    )
    parameters.add_int("offset", "offset", default=8, minimum=-100, maximum=100,
                       description="Z offset for the acroprep or labware")
    parameters.add_int("tough_fill_time", "trough_fill_time", default=87, minimum=1, maximum=120,
                       description="Reservoir water fill time")


async def water_pump_timer(w_pump, run_time):
    await w_pump.turn_motor_on()
    await asyncio.sleep(run_time)
    await w_pump.turn_motor_off()

async def _run_single_pump_cycle(pump, 
                                 water_pump_fixture,
                                 target_pressure: int, cycle_index: int,
                                 sample_interval: float, output_dir: Path,
                                 ctx: protocol_api.ProtocolContext):
    """
    Run one pump cycle for RUN_SEC seconds using the driver's continuous reader.
    Relies on the driver's internal CSV logging (e.g. pump_test.csv) instead of
    creating a per-cycle CSV here.
    """
    start_wall = time.time()
    # Start the filling of the water pump while the vacuum is running
    asyncio.create_task(water_pump_timer(water_pump_fixture, ctx.params.trough_fill_time))
    # Set Pressure
    await asyncio.wait_for(pump.set_pressure(target_pressure), timeout=20)
    await asyncio.sleep(SETTLE_SEC)
    # Turn Pump on
    await pump.change_pump_state(1)
    ctx.comment(f"[cycle {cycle_index}] pump started at target {target_pressure} mbar")

    # Dynamic CSV naming per trial (date + trial index + pressure)
    date_str = datetime.utcnow().strftime("%y-%m-%d %H:%M:%S")
    output_dir.mkdir(parents=True, exist_ok=True)
    trial_csv = output_dir / f"{date_str}_trial_{cycle_index:02d}_{target_pressure}mbar.csv"
    try:
        pump.set_csv_filename(str(trial_csv))
        ctx.comment(f"[cycle {cycle_index}] logging to {trial_csv.name}")
    except Exception as e:
        ctx.comment(f"[cycle {cycle_index}] failed to set CSV filename: {e}")
    # Run the continuous data reader for RUN_SEC seconds.
    try:
        await asyncio.wait_for(pump.read_continuous_data(), timeout=RUN_SEC)
    except asyncio.TimeoutError:
        # Expected: we stop after RUN_SEC
        ctx.comment(f"[cycle {cycle_index}] continuous read duration reached ({RUN_SEC}s)")
    except Exception as e:
        ctx.comment(f"[cycle {cycle_index}] continuous read error: {e}")

    # Vent the pump system to atmospheric pressure while pump is on
    await pump.open_vent()
    await asyncio.sleep(VENT_SEC)
    # 
    await pump.send_stop()
    
    ctx.comment(f"[cycle {cycle_index}] pump stopped; decaying for {DECAY_SEC}s")
    await asyncio.sleep(DECAY_SEC)
    await pump.close_vent()

async def _run_single_pump_api_cycle(pump, 
                                 water_pump_fixture,
                                 target_pressure: int, cycle_index: int,
                                 sample_interval: float, output_dir: Path,
                                 ctx: protocol_api.ProtocolContext):
    """
    Run one pump cycle for RUN_SEC seconds using the driver's continuous reader.
    Relies on the driver's internal CSV logging (e.g. pump_test.csv) instead of
    creating a per-cycle CSV here.
    """
    target_to_pump = target_pressure - 1023
    # Start the filling of the water pump while the vacuum is running
    asyncio.create_task(water_pump_timer(water_pump_fixture, ctx.params.trough_fill_time))
    # Set Pressure and Vacuum to target for x amount of time. 
    await pump.set_vacuum_state(enable_vacuum = True,
                                guage_pressure_mbar = target_to_pump,
                                duration = None,
                                )
                                                    
    await asyncio.sleep(SETTLE_SEC)
    ctx.comment(f"[cycle {cycle_index}] pump started at target {target_pressure} mbar")

    # Dynamic CSV naming per trial (date + trial index + pressure)
    date_str = datetime.utcnow().strftime("%y-%m-%d %H:%M:%S")
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f'output_dir: {output_dir}')
    trial_csv = output_dir / f"{date_str}_trial_{cycle_index:02d}_{target_pressure}mbar.csv"
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
        ctx.comment(f"[cycle {cycle_index}] continuous read duration reached ({RUN_SEC}s)")
    except Exception as e:
        ctx.comment(f"[cycle {cycle_index}] continuous read error: {e}")

    # Vent the pump system to atmospheric pressure while pump is on
    await pump.set_vent_state(False)
    await asyncio.sleep(VENT_SEC)
    # Stop the pump
    await pump.set_vacuum_state(enable_vacuum = False,
                                                    guage_pressure_mbar = target_to_pump,
                                                    duration = None,
                                                    )
    # Close Vent
    ctx.comment(f"[cycle {cycle_index}] pump stopped; decaying for {DECAY_SEC}s")
    await asyncio.sleep(DECAY_SEC)
    await pump.set_vent_state(True)

def run(ctx: protocol_api.ProtocolContext) -> None:         
    port = ctx.params.vacuum_port
    z_offset = ctx.params.offset
    volume = ctx.params.volume
    driver_select = ctx.params.driver_select

    if not ctx.is_simulating():
        if driver_select == "carlos":
            from hardware_testing.drivers import vacuum_pump
        else:
            from opentrons.drivers import vacuum_module
            from hardware_testing.drivers import vacuum_pump

    ctx.load_trash_bin("A3")
    tips = ctx.load_labware("opentrons_flex_96_tiprack_1000uL", "B2",
                            adapter="opentrons_flex_96_tiprack_adapter")
    pip = ctx.load_instrument("flex_96channel_1000", "left", tip_racks=[tips])
    source = ctx.load_labware("nest_1_reservoir_290ml", "B3")
    base = ctx.load_labware("millipore_vacuum_manifold_base", "C3")
    manifold_collar = base.load_labware('millipore_vacuum_manifold_collar_standard')
    filter_plate = manifold_collar.load_labware("attractspe_c18_filter_plate")

    pip.pick_up_tip()

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    pump = None
    pump_fixture = None
    if not ctx.is_simulating():
        try:
            if driver_select == "api":
                # Vacuum Manifold Driver
                pump = loop.run_until_complete(
                    vacuum_module.VacuumModuleDriver.create(port=port, loop=loop)
                    )
            else:
                pump = loop.run_until_complete(
                    vacuum_pump.VacuumModule.create(port=port)
                )
            # Arduino Water pump Driver
            pump_fixture = loop.run_until_complete(
                vacuum_pump.WaterPump.create(port='/dev/ttyACM2', baudrate=115200, loop=loop)
            )
            loop.run_until_complete(pump_fixture.connect())
            ctx.comment("Pump connected.")
        except Exception as e:
            ctx.comment(f"Pump init failed: {e}")

    cycles = ctx.params.cycles
    pressure = ctx.params.pressure
    sample_interval = ctx.params.sample_interval
    
    output_dir = Path(OUTPUT_DIR)

    for cycle in range(1, cycles + 1):
        ctx.comment(f"=== Cycle {cycle}/{cycles} ===")
        pip.aspirate(volume, source["A1"].bottom(ASPIRATE_OFFSET_MM))
        pip.dispense(volume, filter_plate["A1"].top(z_offset), push_out=50)
        # pip.touch_tip(filter_plate["A1"], v_offset=z_offset)
        pip.move_to(filter_plate["A1"].top(10))   # Move away again
        if not ctx.is_simulating():
            if driver_select == "carlos":
                loop.run_until_complete(
                    _run_single_pump_cycle(pump,
                                        pump_fixture, 
                                        pressure, 
                                        cycle, 
                                        sample_interval, 
                                        output_dir, 
                                        ctx)
                )
            else:
                loop.run_until_complete(
                    _run_single_pump_api_cycle(pump,
                                        pump_fixture, 
                                        pressure, 
                                        cycle, 
                                        sample_interval, 
                                        output_dir, 
                                        ctx)
                )
    pip.return_tip()
    if pump:
        try:
            loop.run_until_complete(pump.disconnect())
            ctx.comment("Pump disconnected.")
        except Exception:
            pass
    loop.close()