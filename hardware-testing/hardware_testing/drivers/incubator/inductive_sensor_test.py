import os, sys
from incubator_driver import IncubatorModule, Axis, find_port_by_description
sys.path.append(os.path.abspath('../'))
from mitutoyo_digimatic_indicator import Mitutoyo_Digimatic_Indicator # type: ignore[import]
import time
import csv
import argparse
from datetime import datetime

def record_header(file_name: str):
    with open(file_name, 'w') as f:
        writer = csv.writer(f)
        writer.writerow(["Time(s)", "Cycle", "Inductive Sensor State", "Dial Position(mm)"])

def record_sensor_state(time: float, cycles: int, sensor_state: dict, dial_position: float, file_name: str):
    with open(file_name, 'a') as f:
        writer = csv.writer(f)
        writer.writerow([time, cycles, sensor_state, dial_position])
        print(f"Time: {time}, Cycles: {cycles}, Sensor State: {sensor_state}, Dial Position: {dial_position}")

def test_inductive_sensor(incubator: IncubatorModule, Dial: Mitutoyo_Digimatic_Indicator, file_name: str):
    start_time = time.time()
    for cycles in range(1, args.cycles):
        incubator.home(Axis.R, 0)
        sensor_state = incubator.get_sensor_state()
        time.sleep(0.5)
        if args.use_dial:
            dial_position = Dial.read()
        else:
            dial_position = None
        time.sleep(0.5)
        elapsed_time = time.time() - start_time
        record_sensor_state(elapsed_time, cycles, sensor_state, dial_position, file_name)
        incubator.move_to(Axis.R, 50, 10, 10)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--use-dial", type=bool, default=False, required=True)
    parser.add_argument("--cycles", type=int, default=100, required=True)
    args = parser.parse_args()
    print("Inductive Sensor Test")
    incubator_com_port = find_port_by_description("STLINK-V3 - ST-Link VCP Ctrl")
    incubator = IncubatorModule.create(port=incubator_com_port, baudrate=115200)
    incubator.connect()
    if args.use_dial:
        dial_com_port = find_port_by_description("GageWay SM from MicroRidge")
        print(f"Dial COM Port: {dial_com_port}")
        dial = Mitutoyo_Digimatic_Indicator.create(connection=str(dial_com_port))
        dial.connect()
    date = datetime.now().strftime("%Y-%m-%d")
    file_name = f"{date}, inductive_sensor_test.csv"
    try:
        record_header(file_name)
        test_inductive_sensor(incubator, dial, file_name)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if args.use_dial:
            dial.disconnect()
        incubator.disconnect()
