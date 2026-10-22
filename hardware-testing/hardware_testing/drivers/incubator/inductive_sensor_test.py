import os, sys
from incubator_driver import IncubatorModule, Axis, find_port_by_description
sys.path.append(os.path.abspath('../'))
from mitutoyo_digimatic_indicator import Mitutoyo_Digimatic_Indicator # type: ignore[import]
import time
import csv
import argparse

def record_header(file_name: str):
    with open(file_name, 'w') as f:
        writer = csv.writer(f)
        writer.writerow(["Time(s)", "Cycle", "Inductive Sensor State", "Dial Position(mm)"])

def record_sensor_state(time: float, cycles: int, sensor_state: dict, dial_position: float, file_name: str):
    with open(file_name, 'a') as f:
        writer = csv.writer(f)
        writer.writerow([time, cycles, sensor_state, dial_position])

def test_inductive_sensor(incubator: IncubatorModule, Dial: MitutoyoDialDriver, file_name: str):
    start_time = time.time()
    for cycles in range(1, 100):
        incubator.home(Axis.R, 0)
        sensor_state = incubator.get_sensor_state()
        print(f"Sensor State: {sensor_state}")
        time.sleep(0.5)
        if dial.is_connected():
            dial_position = Dial.get_position()
        else:
            dial_position = None
        time.sleep(0.5)
        elapsed_time = time.time() - start_time
        print(f"Dial Position: {dial_position}")
        record_sensor_state(elapsed_time, cycles, sensor_state, dial_position, file_name)
        incubator.move_to(Axis.R, 50, 10, 10)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dial-port", type=str, required=True)
    parser.add_argument("--use-dial", type=bool, default=False, required=True)
    args = parser.parse_args()
    print("Inductive Sensor Test")
    com_port = find_port_by_description("STLINK-V3 - ST-Link VCP Ctrl")
    incubator = IncubatorModule.create(port=com_port, baudrate=115200)
    incubator.connect()
    if args.use_dial:
        dial = MitutoyoDialDriver.create(port=com_port, baudrate=115200)
        dial.connect()
    file_name = "inductive_sensor_test.csv"
    try:
        record_header(file_name)
        test_inductive_sensor(incubator, dial, file_name)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        incubator.disconnect()
