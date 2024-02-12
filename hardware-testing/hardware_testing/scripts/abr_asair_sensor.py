"""ABR Temperature Humidity Sensors."""

from hardware_testing import data
from hardware_testing.drivers import asair_sensor
import datetime
import sys
import time as t
from typing import List


try:
    sys.path.insert(0, "/var/lib/jupyter/notebooks")
    import google_sheets_tool  # type: ignore[import]
except ImportError:
    raise ImportError(
        "Run on robot. Make sure google_sheets_tool.py is in jupyter notebook."
    )


def _get_user_input(lst: List[str], some_string: str) -> str:
    variable = input(some_string)
    while variable not in lst:
        print(
            f"Your input was {variable}. Expected input is one of the following: {lst}"
        )
        variable = input(some_string)
    return variable


class _ABRAsairSensor:
    def __init__(self, robot: str, duration: int, frequency: int) -> None:
        test_name = "ABR-Environment-Monitoring"
        run_id = data.create_run_id()
        file_name = data.create_file_name(test_name, run_id, robot)
        sensor = asair_sensor.BuildAsairSensor(False, True)
        env_data = sensor.get_reading()
        header = [
            "Robot",
            "Timestamp",
            "Date",
            "Time",
            "Temp (oC)",
            "Relative Humidity (%)",
        ]
        header_str = ",".join(header) + "\n"
        data.append_data_to_file(test_name, run_id, file_name, header_str)
        # Upload to google has passed
        credentials_path = "/var/lib/jupyter/notebooks/abr.json"
        try:
            google_sheet = google_sheets_tool.google_sheet(
                credentials_path, "ABR Ambient Conditions", tab_number=0
            )
            print("Connected to the google sheet.")
        except FileNotFoundError:
            print(
                "There is no google sheets credentials. Make sure credentials in jupyter notebook."
            )
        results_list = []  # type: List
        start_time = datetime.datetime.now()
        while True:
            env_data = sensor.get_reading()
            timestamp = datetime.datetime.now()
            new_timestamp = timestamp - datetime.timedelta(hours=5)
            date = new_timestamp.date()
            time = new_timestamp.time()
            temp = env_data.temperature
            print(temp)
            rh = env_data.relative_humidity
            print(rh)
            row = [
                robot,
                str(new_timestamp),
                str(date),
                str(time),
                temp,
                rh,
            ]
            results_list.append(row)
            # Check if duration elapsed
            elapsed_time = datetime.datetime.now() - start_time
            if elapsed_time.total_seconds() >= duration * 60:
                break
            # write to google sheet
            try:
                google_sheet.write_header(header)
                google_sheet.update_row_index()
                google_sheet.write_to_row(row)
                print("Wrote row")
            except RuntimeError:
                print("Did not write row.")
            # Delay for desired frequency minutes before the next iteration
            t.sleep(frequency * 60)  # seconds

        # Upload to robot testing data folder
        result_string = ""
        for sublist in results_list:
            row_str = ", ".join(map(str, sublist)) + "\n"  # type: str
            result_string += row_str
            save_file_path = data.append_data_to_file(
                test_name, run_id, file_name, result_string
            )
        print(f"Saved to robot: f{save_file_path}.")
        print(
            f"Done. Ran for {duration} minutes and collected every {frequency} minutes."
        )


if __name__ == "__main__":
    robot_list = [
        "DVT1ABR1",
        "DVT1ABR2",
        "DVT1ABR3",
        "DVT1ABR4",
        "DVT2ABR5",
        "DVT2ABR6",
        "PVT1ABR7",
        "PVT1ABR8",
        "PVT1ABR9",
        "PVT1ABR10",
        "PVT1ABR11",
        "PVT1ABR12",
    ]  # type: List
    robot = _get_user_input(robot_list, "Robot: ")
    duration = int(input("Duration (min): "))
    frequency = int(input("Frequency (min): "))
    _ABRAsairSensor(robot, duration, frequency)
