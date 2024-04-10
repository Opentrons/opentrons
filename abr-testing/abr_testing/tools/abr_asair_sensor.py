"""ABR Temperature Humidity Sensors."""

from hardware_testing import data  # type: ignore[import]
from hardware_testing.drivers import asair_sensor  # type: ignore[import]
import datetime
import time as t
from typing import List
import argparse
from abr_testing.automation import google_sheets_tool


class _ABRAsairSensor:
    def __init__(self, robot: str, duration: int, frequency: int) -> None:
        try:
            credentials_path = "/var/lib/jupyter/notebooks/abr.json"
        except FileNotFoundError:
            print("Make sure credentials file is in jupyter notebook.")
        test_name = "ABR-Environment-Monitoring"
        run_id = data.create_run_id()
        file_name = data.create_file_name(test_name, run_id, robot)
        sensor = asair_sensor.BuildAsairSensor(False, True)
        print(sensor)
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
        try:
            google_sheet = google_sheets_tool.google_sheet(
                credentials_path, "ABR Ambient Conditions", tab_number=0
            )
            print("Connected to the google sheet.")
        except FileNotFoundError:
            print(
                "There are no google sheets credentials. Make sure credentials in jupyter notebook."
            )
        results_list: List = []
        start_time = datetime.datetime.now()
        while True:
            env_data = sensor.get_reading()
            timestamp = datetime.datetime.now()
            # Time adjustment for ABR robot timezone
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
                google_sheet.token_check()
                google_sheet.write_header(header)
                google_sheet.update_row_index()
                google_sheet.write_to_row(row)
                print("Wrote row")
            except RuntimeError:
                print("Did not write row.")
            # Delay for desired frequency minutes before the next iteration
            t.sleep(frequency * 60)  # seconds

        # Upload to robot testing data folder
        for sublist in results_list:
            row_str = ", ".join(map(str, sublist)) + "\n"  # type: str
            save_file_path = data.append_data_to_file(
                test_name, run_id, file_name, row_str
            )
        print(f"Saved to robot: f{save_file_path}.")
        print(
            f"Done. Ran for {duration} minutes and collected every {frequency} minutes."
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Starts Temp/RH Sensor.")
    parser.add_argument(
        "robot", metavar="ROBOT", type=str, nargs=1, help="ABR Robot Name"
    )
    parser.add_argument(
        "duration",
        metavar="DURATION",
        type=int,
        nargs=1,
        help="Duration (min) to run sensor for.",
    )
    parser.add_argument(
        "frequency",
        metavar="FREQUENCY",
        type=int,
        nargs=1,
        help="How frequently to record temp/rh (min for.",
    )
    args = parser.parse_args()
    _ABRAsairSensor(args.robot[0], args.duration[0], args.frequency[0])
