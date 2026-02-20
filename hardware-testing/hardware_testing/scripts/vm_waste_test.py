import asyncio
import logging
import datetime
from opentrons.drivers import vacuum_module
from hardware_testing.drivers.flowrate_sensor import driver
import argparse


# target_pressure = 600
atm_pressure = 1023
# Tunables (can move some to parameters)
SETTLE_SEC = 21
RUN_SEC = 35
DECAY_SEC = 10
VENT_SEC = 10
current_datetime = datetime.datetime.now(datetime.UTC).strftime("%y_%m_%d_%H_%M_%S")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='/data/testing_data/test.log',
    filemode='a'
)

def get_file_name(prefix: str) -> str:
    """Generate a timestamped file name."""
    current_datetime = datetime.datetime.now(datetime.UTC).strftime("%y_%m_%d_%H_%M_%S")

async def flow_rate_thread(target_pressure):
    file_name = f'/data/testing_data/example-test/FlowrateData_{target_pressure}_{current_datetime}.csv'
    sensor = await driver.MassFlowSensor.create(port="/dev/ttyACM1", csv_path=file_name)
    try:
        sensor.set_csv_filename(file_name)
        await sensor.read_continuous_data(RUN_SEC+SETTLE_SEC)
    except Exception as e:
        logging.critical("Critical failure: %s", e)

async def vacuum_manifold(target_pressure):
    file_name = f'/data/testing_data/example-test/PressureData_{target_pressure}_{current_datetime}.csv'
    pump = await vacuum_module.VacuumModuleDriver.create(port='/dev/ttyACM0', loop=None)
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
    try:
        await pump.read_continuous_data(RUN_SEC+SETTLE_SEC)
        
    except asyncio.TimeoutError:
        # Expected: we stop after RUN_SEC
        logging.info(f"continuous read duration reached ({RUN_SEC}s)")
    except Exception as e:
        logging.info(f"continuous read error: {e}")

    # Vent the pump system to atmospheric pressure while pump is on
    await pump.set_vent_state(False)
    await asyncio.sleep(VENT_SEC)
    # Stop the pump
    await pump.set_vacuum_state(enable_vacuum = False,
                                guage_pressure_mbar = target_to_pump,
                                duration = None,
                                )
    logging.info(f"continuous read duration reached ({RUN_SEC}s)")
    await asyncio.sleep(DECAY_SEC)
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