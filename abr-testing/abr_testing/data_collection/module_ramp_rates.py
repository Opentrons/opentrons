"""Get ramp rates of modules."""
from abr_testing.automation import google_sheets_tool
from abr_testing.data_collection import read_robot_logs
import argparse
import os
import sys
import json
from datetime import datetime
from typing import Dict, Any
import requests


def ramp_rate(file_results: Dict[str, Any]) -> Dict[int, float]:
    """Get ramp rates."""
    i = 0
    commands = file_results["commands"]
    for command in commands:
        commandType = command["commandType"]
        if (
            commandType == "thermocycler/setTargetBlockTemperature"
            or commandType == "temperatureModule/setTargetTemperature"
            or commandType == "heaterShaker/setTargetTemperature"
        ):
            temp = command["params"].get("celsius", 0.0)
        if (
            commandType == "thermocycler/waitForBlockTemperature"
            or commandType == "temperatureModule/waitForTemperature"
            or commandType == "heaterShaker/waitForTemperature"
        ):
            start_time = datetime.strptime(
                command.get("startedAt", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
            )
            end_time = datetime.strptime(
                command.get("completedAt", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
            )
            duration = (end_time - start_time).total_seconds()
            i += 1
            temps_and_durations[duration] = temp
    ramp_rates = {}
    times = list(temps_and_durations.keys())
    for i in range(len(times) - 1):
        time1 = times[i]
        time2 = times[i + 1]
        temp1 = temps_and_durations[time1]
        temp2 = temps_and_durations[time2]
        ramp_rate = (temp2 - temp1) / (time2)
        ramp_rates[i] = ramp_rate
    return ramp_rates


if __name__ == "__main__":
    # SCRIPT ARGUMENTS
    parser = argparse.ArgumentParser(description="Read run logs on google drive.")
    parser.add_argument(
        "storage_directory",
        metavar="STORAGE_DIRECTORY",
        type=str,
        nargs=1,
        help="Path to long term storage directory for run logs.",
    )
    parser.add_argument(
        "google_sheet_name",
        metavar="GOOGLE_SHEET_NAME",
        type=str,
        nargs=1,
        help="Google sheet name.",
    )
    parser.add_argument(
        "email", metavar="EMAIL", type=str, nargs=1, help="opentrons gmail."
    )
    args = parser.parse_args()
    storage_directory = args.storage_directory[0]
    google_sheet_name = args.google_sheet_name[0]
    # FIND CREDENTIALS FILE
    try:
        credentials_path = os.path.join(storage_directory, "credentials.json")
    except FileNotFoundError:
        print(f"Add credentials.json file to: {storage_directory}.")
        sys.exit()
    # CONNECT TO GOOGLE SHEET
    google_sheet = google_sheets_tool.google_sheet(
        credentials_path, google_sheet_name, 1
    )
    run_ids_on_sheet = google_sheet.get_column(2)
    runs_and_robots = {}
    for filename in os.listdir(storage_directory):
        file_path = os.path.join(storage_directory, filename)
        if file_path.endswith(".json"):
            with open(file_path) as file:
                file_results = json.load(file)
        else:
            continue
        # CHECK if file is ramp rate run
        run_id = file_results.get("run_id", None)
        temps_and_durations: Dict[float, float] = dict()
        if run_id is not None and run_id not in run_ids_on_sheet:

            ramp_rates = ramp_rate(file_results)
            protocol_name = file_results["protocol"]["metadata"].get("protocolName", "")
            if "Ramp Rate" in protocol_name:
                ip = filename.split("_")[0]
                if len(ramp_rates) > 1:
                    cooling_ramp_rate = abs(min(ramp_rates.values()))
                    heating_ramp_rate = abs(max(ramp_rates.values()))
                    start_time = datetime.strptime(
                        file_results.get("startedAt", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
                    )
                    start_date = str(start_time.date())
                    module_serial_number = file_results["modules"][0].get(
                        "serialNumber", "NaN"
                    )
                    try:
                        response = requests.get(
                            f"http://{ip}:31950/modules",
                            headers={"opentrons-version": "3"},
                        )
                        modules = response.json()
                        for module in modules["data"]:
                            if module["serialNumber"] == module_serial_number:
                                firmwareVersion = module["firmwareVersion"]
                            else:
                                firmwareVersion = "NaN"
                    except requests.exceptions.ConnectionError:
                        firmwareVersion = "NaN"
                    row = {
                        "Robot": file_results.get("robot_name", ""),
                        "Run_ID": run_id,
                        "Protocol_Name": file_results["protocol"]["metadata"].get(
                            "protocolName", ""
                        ),
                        "Software Version": file_results.get("API_Version", ""),
                        "Firmware Version": firmwareVersion,
                        "Date": start_date,
                        "Serial Number": module_serial_number,
                        "Approx. Average Heating Ramp Rate (C/s)": heating_ramp_rate,
                        "Approx. Average Cooling Ramp Rate (C/s)": cooling_ramp_rate,
                    }
                    headers = list(row.keys())
                    runs_and_robots[run_id] = row
                    read_robot_logs.write_to_local_and_google_sheet(
                        runs_and_robots,
                        storage_directory,
                        google_sheet_name,
                        google_sheet,
                        headers,
                    )
        else:
            continue
