"""Vacuum module waste and leak test script."""
import asyncio
import logging
import datetime
import time
from opentrons.drivers import vacuum_module
from opentrons.drivers.vacuum_module.types import VentState
from typing import Dict
from hardware_testing.drivers.flowrate_sensor import driver
import dataclasses
import argparse
import csv
import serial.tools.list_ports  # type: ignore[import]

# target_pressure = 600
atm_pressure = 1013.25
# Tunables (can move some to parameters)
SETTLE_SEC = 21
RUN_SEC = 35
DECAY_SEC = 20
VENT_SEC = 10
Ard_idVendor = 9025
Ard_idProduct = 66

VM_idVendor = 1155
VM_idProduct = 61248

st = time.perf_counter()
current_datetime = datetime.datetime.now(datetime.timezone.utc).strftime(
    "%y_%m_%d_%H_%M_%S"
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("/data/testing_data/" + "test.log"),
        logging.StreamHandler(),
    ],
)

logger = logging.getLogger(__name__)
logger.info(f"continuous read error: {12}")


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
) -> None:
    """Run continuous data read and handle expected timeout and errors."""
    try:
        await read_continuous_data(f_name, pump, start_time, duration)
    except asyncio.TimeoutError:
        # Expected: we stop after RUN_SEC
        logging.info(f"continuous read duration reached ({duration}s)")
    except Exception as e:
        logging.info(f"continuous read error: {e}")


async def flow_rate_thread(target_pressure: int) -> None:
    """Concurrently read flow rate sensor data during a vacuum test run."""
    m_port = await find_port_by_id(Ard_idVendor, Ard_idProduct)
    if not m_port:
        logging.error("Could not find mass flow sensor port")
        return
    loop = asyncio.get_running_loop()
    path = "/data/testing_data/test-data/"
    f_name = f"FlowrateData_{target_pressure}_{current_datetime}_{args.test_name}.csv"
    file_name = path + f_name
    sensor = await driver.MassFlowSensor.create(
        port=m_port, csv_path=file_name, loop=loop
    )
    try:
        await sensor.set_csv_filename(file_name)
        await sensor.read_continuous_data(
            args.run_sec + args.settle_sec + args.decay_sec
        )
    except Exception as e:
        logging.critical("Critical failure: %s", e)


async def vacuum_manifold(target_pressure: int) -> None:
    """Run a full vacuum manifold pressure hold/decay cycle."""
    port = await find_port_by_id(VM_idVendor, VM_idProduct)
    if not port:
        logging.error("Could not find vacuum module port")
        return
    loop = asyncio.get_running_loop()
    path = "/data/testing_data/test-data/"
    f_name = f"PressureData_{target_pressure}_{current_datetime}_{args.test_name}.csv"
    file_name = path + f_name
    pump = await vacuum_module.VacuumModuleDriver.create(port=port, loop=loop)

    start_time = time.perf_counter()
    target_to_pump = target_pressure - atm_pressure
    try:
        await pump.set_vent_state(VentState.OPENED)
        await asyncio.sleep(1)
        # Set Pressure and Vacuum to target for x amount of time.
        await pump.set_vacuum_state(
            enable_vacuum=True,
            gauge_pressure_mbar=target_to_pump,
            duration_s=None,
        )
        logging.info(f"pump started at target {target_pressure} mbar")
        # Run the continuous data reader for RUN_SEC seconds.
        await read_data(file_name, pump, start_time, args.run_sec + args.settle_sec)
        # Stop the pump
        await pump.set_vacuum_state(
            enable_vacuum=False,
            gauge_pressure_mbar=target_to_pump,
            duration_s=None,
        )
        # Vent the pump system to atmospheric pressure while pump is on
        await pump.set_vent_state(VentState.CLOSED)
        await read_data(file_name, pump, start_time, args.vent_sec + args.decay_sec)
        await pump.set_vent_state(VentState.OPENED)
    except Exception as e:
        logging.error(f"vacuum_manifold error: {e}")
        raise
    finally:
        # Always stop the pump regardless of success or failure
        await pump.set_vacuum_state(
            enable_vacuum=False,
            gauge_pressure_mbar=target_to_pump,
            duration_s=None,
        )


async def main(args: argparse.Namespace) -> None:
    """Run flow rate and vacuum manifold tasks concurrently."""
    thread_1 = asyncio.create_task(flow_rate_thread(args.target_pressure))
    thread_2 = asyncio.create_task(vacuum_manifold(args.target_pressure))
    await asyncio.gather(thread_1, thread_2)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--target_pressure", type=int, default=600)
    parser.add_argument("--run_sec", type=int, default=35)
    parser.add_argument("--vent_sec", type=int, default=10)
    parser.add_argument("--decay_sec", type=int, default=20)
    parser.add_argument("--settle_sec", type=int, default=21)
    parser.add_argument("--test_name", type=str, default="test_name")
    args = parser.parse_args()

    logging.info("Flow rate sensor initialized.")
    asyncio.run(main(args))
