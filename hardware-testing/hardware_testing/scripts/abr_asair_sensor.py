"""ABR Temperature Humidity Sensors."""

from hardware_testing import data
from hardware_testing.drivers import asair_sensor
import datetime
import sys
import time as t
from typing import List
import os
import argparse
import pytz


class _ABRAsairSensor:
    def __init__(self, robot: str, duration: int, frequency: int) -> None:
        try:
            sys.path.insert(0, "/var/lib/jupyter/notebooks")
            import google_sheets_tool  # type: ignore[import]

            credentials_path = "/var/lib/jupyter/notebooks/abr.json"
        except ImportError:
            raise ImportError(
                "Run on robot. Make sure google_sheets_tool.py is in jupyter notebook."
            )
        print(os.path.exists(credentials_path))
        test_name = "ABR-Environment-Monitoring"
        run_id = data.create_run_id()
        file_name = data.create_file_name(test_name, run_id, robot)
        sensor = asair_sensor.BuildAsairSensor(False, False, "USB0")
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
        results_list = []  # type: List
        timezone = pytz.timezone("America/New_York")
        start_time = datetime.datetime.now(timezone)
        # start_time = datetime.datetime.now(tz=tzinfo.utcoffset(timezone))
        while True:
            env_data = sensor.get_reading()
            timestamp = datetime.datetime.now(timezone)
            # Time adjustment for ABR robot timezone
            new_timestamp = timestamp
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
            elapsed_time = datetime.datetime.now(timezone) - start_time
            if elapsed_time.total_seconds() >= duration * 60:
                break
            # write to google sheet
            try:
                if google_sheet.credentials.access_token_expired:
                    google_sheet.gc.login()
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
