import asyncio
import logging
import datetime
import time
from opentrons.drivers import vacuum_module
from hardware_testing.drivers.flowrate_sensor import driver
import argparse


# target_pressure = 600
atm_pressure = 1023
# Tunables (can move some to parameters)
SETTLE_SEC = 21
RUN_SEC = 35
DECAY_SEC = 20
VENT_SEC = 10
current_datetime = datetime.datetime.now(datetime.timezone.utc).strftime("%y_%m_%d_%H_%M_%S")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='/data/testing_data/test.log',
    filemode='a'
)

async def read_data(pump, start_time, duration: int):
    try:
        await pump.read_continuous_data(start_time, duration)
    except asyncio.TimeoutError:
        # Expected: we stop after RUN_SEC
        logging.info(f"continuous read duration reached ({duration}s)")
    except Exception as e:
        logging.info(f"continuous read error: {e}")

async def flow_rate_thread(target_pressure):
    file_name = f'/data/testing_data/test-data/FlowrateData_{target_pressure}_{current_datetime}.csv'
    sensor = await driver.MassFlowSensor.create(port="/dev/ttyACM0", csv_path=file_name)
    try:
        sensor.set_csv_filename(file_name)
        await sensor.read_continuous_data(RUN_SEC+SETTLE_SEC+VENT_SEC+DECAY_SEC)
    except Exception as e:
        logging.critical("Critical failure: %s", e)

async def vacuum_manifold(target_pressure):
    file_name = f'/data/testing_data/test-data/PressureData_{target_pressure}_{current_datetime}.csv'
    pump = await vacuum_module.VacuumModuleDriver.create(port='/dev/ttyACM1', loop=None)
    start_time = time.perf_counter()
    target_to_pump = target_pressure - atm_pressure
    # Set Pressure and Vacuum to target for x amount of time. 
    await pump.set_vacuum_state(enable_vacuum = True,
                                guage_pressure_mbar = target_to_pump,
                                duration = None,
                                )
                                                    
    # await asyncio.sleep(SETTLE_SEC)
    logging.info(f"pump started at target {target_pressure} mbar")
    try:
        pump.set_csv_filename(file_name)
        logging.info(f"logging to {file_name}")
    except Exception as e:
        logging.info(f"failed to set CSV filename: {e}")
    # Run the continuous data reader for RUN_SEC seconds.
    await read_data(pump, start_time, RUN_SEC+SETTLE_SEC)
    # Stop the pump
    await pump.set_vacuum_state(enable_vacuum = False,
                                guage_pressure_mbar = target_to_pump,
                                duration = None,
                                )
    # Vent the pump system to atmospheric pressure while pump is on
    await pump.set_vent_state(False)
    await read_data(pump, start_time, VENT_SEC)

    await read_data(pump, start_time, DECAY_SEC)
    await pump.set_vent_state(True)


async def main(args):
    thread_1 = asyncio.create_task(flow_rate_thread(args.target_pressure))
    thread_2 = asyncio.create_task(vacuum_manifold(args.target_pressure))

    await asyncio.gather(thread_1, thread_2)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--target_pressure", type=int, default=600)
    parser.add_argument("--run_sec", type=int, default=35)
    args = parser.parse_args()

    logging.info("Flow rate sensor initialized.")
    asyncio.run(main(args))