"""ABR Read Robot Logs.

This library has functions to download logs from robots, extracting wanted information,
and uploading to a google sheet using credentials and google_sheets_tools module
saved in a local directory.
"""
import csv
from datetime import datetime
import os
from abr_testing.data_collection.error_levels import ERROR_LEVELS_PATH
from typing import List, Dict, Any, Tuple, Set
import time as t
import json
import requests


def command_time(command: Dict[str, str]) -> Tuple[float, float]:
    """Calculate total create and complete time per command."""
    try:
        create_time = datetime.strptime(
            command.get("createdAt", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
        )
        start_time = datetime.strptime(
            command.get("startedAt", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
        )
        complete_time = datetime.strptime(
            command.get("completedAt", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
        )
        create_to_start = (start_time - create_time).total_seconds()
        start_to_complete = (complete_time - start_time).total_seconds()
    except ValueError:
        create_to_start = 0
        start_to_complete = 0
    return create_to_start, start_to_complete


def hs_commands(file_results: Dict[str, Any]) -> Dict[str, float]:
    """Gets total latch engagements, homes, rotations and total on time (sec) for heater shaker."""
    # TODO: modify for cases that have more than 1 heater shaker.
    commandData = file_results.get("commands", "")
    hs_latch_count: float = 0.0
    hs_temp: float = 0.0
    hs_home_count: float = 0.0
    hs_speed: float = 0.0
    hs_rotations: Dict[str, float] = dict()
    hs_temps: Dict[str, float] = dict()
    temp_time = None
    shake_time = None
    for command in commandData:
        commandType = command["commandType"]
        # Heatershaker
        # Latch count
        if (
            commandType == "heaterShaker/closeLabwareLatch"
            or commandType == "heaterShaker/openLabwareLatch"
        ):
            hs_latch_count += 1
        # Home count
        elif commandType == "heaterShaker/deactivateShaker":
            hs_home_count += 1
            deactivate_time = datetime.strptime(
                command.get("startedAt", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
            )
            if temp_time is not None and deactivate_time > temp_time:
                temp_duration = (deactivate_time - temp_time).total_seconds()
                hs_temps[hs_temp] = hs_temps.get(hs_temp, 0.0) + temp_duration
            if shake_time is not None and deactivate_time > shake_time:
                shake_duration = (deactivate_time - shake_time).total_seconds()
                hs_rotations[hs_speed] = hs_rotations.get(hs_speed, 0.0) + (
                    (hs_speed * shake_duration) / 60
                )
        # of Rotations
        elif commandType == "heaterShaker/setAndWaitForShakeSpeed":
            hs_speed = command["params"]["rpm"]
            shake_time = datetime.strptime(
                command.get("completedAt", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
            )
        # On Time
        elif commandType == "heaterShaker/setTargetTemperature":
            # if heater shaker temp is not deactivated.
            hs_temp = command["params"]["celsius"]
            temp_time = datetime.strptime(
                command.get("completedAt", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
            )

    hs_total_rotations = sum(hs_rotations.values())
    hs_total_temp_time = sum(hs_temps.values())
    hs_dict = {
        "Heatershaker # of Latch Engagements": hs_latch_count,
        "Heatershaker # of Homes": hs_home_count,
        "Heatershaker # of Rotations": hs_total_rotations,
        "Heatershaker Temp On Time (sec)": hs_total_temp_time,
    }
    return hs_dict


def temperature_module_commands(file_results: Dict[str, Any]) -> Dict[str, float]:
    """Get # of temp changes and total temp on time for temperature module from run log."""
    # TODO: modify for cases that have more than 1 temperature module.
    tm_temp_change = 0
    tm_temps: Dict[str, float] = dict()
    temp_time = None
    deactivate_time = None
    commandData = file_results.get("commands", "")
    for command in commandData:
        commandType = command["commandType"]
        if commandType == "temperatureModule/setTargetTemperature":
            tm_temp = command["params"]["celsius"]
            tm_temp_change += 1
        if commandType == "temperatureModule/waitForTemperature":
            temp_time = datetime.strptime(
                command.get("completedAt", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
            )
        if commandType == "temperatureModule/deactivate":
            deactivate_time = datetime.strptime(
                command.get("completedAt", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
            )
            if temp_time is not None and deactivate_time > temp_time:
                temp_duration = (deactivate_time - temp_time).total_seconds()
                tm_temps[tm_temp] = tm_temps.get(tm_temp, 0.0) + temp_duration
    if temp_time is not None and deactivate_time is None:
        # If temperature module is not deactivated, protocol completedAt time stamp used.
        protocol_end = datetime.strptime(
            file_results.get("completedAt", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
        )
        temp_duration = (protocol_end - temp_time).total_seconds()
        tm_temps[tm_temp] = tm_temps.get(tm_temp, 0.0) + temp_duration
    tm_total_temp_time = sum(tm_temps.values())
    tm_dict = {
        "Temp Module # of Temp Changes": tm_temp_change,
        "Temp Module Temp On Time (sec)": tm_total_temp_time,
    }
    return tm_dict


def thermocycler_commands(file_results: Dict[str, Any]) -> Dict[str, float]:
    """Counts # of lid engagements, temp changes, and temp sustaining mins."""
    # TODO: modify for cases that have more than 1 thermocycler.
    commandData = file_results.get("commands", "")
    lid_engagements: float = 0.0
    block_temp_changes: float = 0.0
    lid_temp_changes: float = 0.0
    lid_temps: Dict[str, float] = dict()
    block_temps: Dict[str, float] = dict()
    lid_on_time = None
    lid_off_time = None
    block_on_time = None
    block_off_time = None
    for command in commandData:
        commandType = command["commandType"]
        if (
            commandType == "thermocycler/openLid"
            or commandType == "thermocycler/closeLid"
        ):
            lid_engagements += 1
        if commandType == "thermocycler/setTargetBlockTemperature":
            block_temp = command["params"]["celsius"]
            block_temp_changes += 1
            block_on_time = datetime.strptime(
                command.get("completedAt", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
            )
        if commandType == "thermocycler/setTargetLidTemperature":
            lid_temp_changes += 1
            lid_temp = command["params"]["celsius"]
            lid_on_time = datetime.strptime(
                command.get("completedAt", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
            )
        if commandType == "thermocycler/deactivateLid":
            lid_off_time = datetime.strptime(
                command.get("completedAt", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
            )
            if lid_on_time is not None and lid_off_time > lid_on_time:
                lid_duration = (lid_off_time - lid_on_time).total_seconds()
                lid_temps[lid_temp] = lid_temps.get(lid_temp, 0.0) + lid_duration
        if commandType == "thermocycler/deactivateBlock":
            block_off_time = datetime.strptime(
                command.get("completedAt", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
            )
            if block_on_time is not None and block_off_time > block_on_time:
                block_duration = (block_off_time - block_on_time).total_seconds()
                block_temps[block_temp] = (
                    block_temps.get(block_temp, 0.0) + block_duration
                )
        if commandType == "thermocycler/runProfile":
            profile = command["params"]["profile"]
            total_changes = len(profile)
            block_temp_changes += total_changes
            for cycle in profile:
                block_temp = cycle["celsius"]
                block_time = cycle["holdSeconds"]
                block_temps[block_temp] = block_temps.get(block_temp, 0.0) + block_time
    if block_on_time is not None and block_off_time is None:
        # If thermocycler block not deactivated protocol completedAt time stamp used
        protocol_end = datetime.strptime(
            file_results.get("completedAt", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
        )
        temp_duration = (protocol_end - block_on_time).total_seconds()
        block_temps[block_temp] = block_temps.get(block_temp, 0.0) + temp_duration
    if lid_on_time is not None and lid_off_time is None:
        # If thermocycler lid not deactivated protocol completedAt time stamp used
        protocol_end = datetime.strptime(
            file_results.get("completedAt", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
        )
        temp_duration = (protocol_end - lid_on_time).total_seconds()
        lid_temps[lid_temp] = block_temps.get(lid_temp, 0.0) + temp_duration

    block_total_time = sum(block_temps.values())
    lid_total_time = sum(lid_temps.values())

    tc_dict = {
        "Thermocycler # of Lid Engagements": lid_engagements,
        "Thermocycler Block # of Temp Changes": block_temp_changes,
        "Thermocycler Block Temp On Time (sec)": block_total_time,
        "Thermocycler Lid # of Temp Changes": lid_temp_changes,
        "Thermocycler Lid Temp On Time (sec)": lid_total_time,
    }

    return tc_dict


def create_abr_data_sheet(
    storage_directory: str, file_name: str, headers: List[str]
) -> str:
    """Creates csv file to log ABR data."""
    file_name_csv = file_name + ".csv"
    print(file_name_csv)
    sheet_location = os.path.join(storage_directory, file_name_csv)
    if os.path.exists(sheet_location):
        print(f"File {sheet_location} located. Not overwriting.")
    else:
        with open(sheet_location, "w") as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=headers)
            writer.writeheader()
            print(f"Created file. Located: {sheet_location}.")
    return sheet_location


def get_error_info(file_results: Dict[str, Any]) -> Tuple[int, str, str, str, str]:
    """Determines if errors exist in run log and documents them."""
    error_levels = []
    # Read error levels file
    with open(ERROR_LEVELS_PATH, "r") as error_file:
        error_levels = list(csv.reader(error_file))
    num_of_errors = len(file_results["errors"])
    if num_of_errors == 0:
        error_type = ""
        error_code = ""
        error_instrument = ""
        error_level = ""
        return 0, error_type, error_code, error_instrument, error_level
    commands_of_run: List[Dict[str, Any]] = file_results.get("commands", [])
    run_command_error: Dict[str, Any] = commands_of_run[-1]
    error_str: int = len(run_command_error.get("error", ""))
    if error_str > 1:
        error_type = run_command_error["error"].get("errorType", "")
        error_code = run_command_error["error"].get("errorCode", "")
        try:
            # Instrument Error
            error_instrument = run_command_error["error"]["errorInfo"]["node"]
        except KeyError:
            # Module Error
            error_instrument = run_command_error["error"]["errorInfo"].get("port", "")
    else:
        error_type = file_results["errors"][0]["errorType"]
        print(error_type)
        error_code = file_results["errors"][0]["errorCode"]
        error_instrument = file_results["errors"][0]["detail"]
    for error in error_levels:
        code_error = error[1]
        if code_error == error_code:
            error_level = error[4]

    return num_of_errors, error_type, error_code, error_instrument, error_level


def write_to_local_and_google_sheet(
    runs_and_robots: Dict[Any, Dict[str, Any]],
    storage_directory: str,
    file_name: str,
    google_sheet: Any,
    header: List[str],
) -> None:
    """Write data dictionary to google sheet and local csv."""
    sheet_location = os.path.join(storage_directory, file_name)
    file_exists = os.path.exists(sheet_location) and os.path.getsize(sheet_location) > 0
    list_of_runs = list(runs_and_robots.keys())
    with open(sheet_location, "a", newline="") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(header)
        for run in range(len(list_of_runs)):
            row = runs_and_robots[list_of_runs[run]].values()
            row_list = list(row)
            writer.writerow(row_list)
            google_sheet.write_header(header)
            google_sheet.token_check()
            google_sheet.update_row_index()
            google_sheet.write_to_row(row_list)
            t.sleep(3)


def read_abr_data_sheet(
    storage_directory: str, file_name_csv: str, google_sheet: Any
) -> Set[str]:
    """Reads current run sheet to determine what new run data should be added."""
    print(file_name_csv)
    sheet_location = os.path.join(storage_directory, file_name_csv)
    runs_in_sheet = set()
    # Read the CSV file
    with open(sheet_location, "r") as csv_start:
        data = csv.DictReader(csv_start)
        headers = data.fieldnames
        if headers is not None:
            for row in data:
                run_id = row[headers[1]]
                runs_in_sheet.add(run_id)
        print(f"There are {str(len(runs_in_sheet))} runs documented in the ABR sheet.")
    # Read Google Sheet
    google_sheet.token_check()
    google_sheet.write_header(headers)
    google_sheet.update_row_index()
    return runs_in_sheet


def get_run_ids_from_storage(storage_directory: str) -> Set[str]:
    """Read all files in storage directory, extracts run id, adds to set."""
    os.makedirs(storage_directory, exist_ok=True)
    list_of_files = os.listdir(storage_directory)
    run_ids = set()
    for this_file in list_of_files:
        read_file = os.path.join(storage_directory, this_file)
        if read_file.endswith(".json"):
            file_results = json.load(open(read_file))
        run_id = file_results.get("run_id", "")
        if len(run_id) > 0:
            run_ids.add(run_id)
    return run_ids


def get_unseen_run_ids(runs: Set[str], runs_from_storage: Set[str]) -> Set[str]:
    """Subtracts runs from storage from current runs being read."""
    runs_to_save = runs - runs_from_storage
    print(f"There are {str(len(runs_to_save))} new run(s) to save.")
    return runs_to_save


def save_run_log_to_json(
    ip: str, results: Dict[str, Any], storage_directory: str
) -> str:
    """Save run log to local json file."""
    data_file_name = ip + "_" + results["run_id"] + ".json"
    saved_file_path = os.path.join(storage_directory, data_file_name)
    json.dump(results, open(saved_file_path, mode="w"))
    return saved_file_path


def get_run_ids_from_google_drive(google_drive: Any) -> Set[str]:
    """Get run ids in google drive folder."""
    # Run ids in google_drive_folder
    file_names = google_drive.list_folder()
    run_ids_on_gd = set()
    for file in file_names:
        if file.endswith(".json") and "_" in file:
            file_id = file.split(".json")[0].split("_")[1]
            run_ids_on_gd.add(file_id)
    return run_ids_on_gd


def write_to_sheets(
    sheet_location: str, google_sheet: Any, row_list: List[Any], headers: List[str]
) -> None:
    """Write list to google sheet and csv."""
    with open(sheet_location, "a", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(row_list)
        # Read Google Sheet
        google_sheet.token_check()
        google_sheet.write_header(headers)
        google_sheet.update_row_index()
        google_sheet.write_to_row(row_list)
        t.sleep(5)  # Sleep added to avoid API error.


def get_calibration_offsets(
    ip: str, storage_directory: str
) -> Tuple[str, Dict[str, Any]]:
    """Connect to robot via ip and get calibration data."""
    calibration = dict()
    # Robot Information [Name, Software Version]
    response = requests.get(
        f"http://{ip}:31950/health", headers={"opentrons-version": "3"}
    )
    health_data = response.json()
    robot_name = health_data.get("name", "")
    api_version = health_data.get("api_version", "")
    pull_date_timestamp = datetime.now()
    date = pull_date_timestamp.date().isoformat()
    file_date = str(pull_date_timestamp).replace(":", "").split(".")[0]
    calibration["Robot"] = robot_name
    calibration["Software Version"] = api_version
    calibration["Pull Date"] = date
    calibration["Pull Timestamp"] = pull_date_timestamp.isoformat()
    calibration["run_id"] = "calibration" + "_" + file_date
    # Calibration [Instruments, modules, deck]
    response = requests.get(
        f"http://{ip}:31950/instruments",
        headers={"opentrons-version": "3"},
        params={"cursor": 0, "pageLength": 0},
    )
    instruments: Dict[str, Any] = response.json()
    calibration["Instruments"] = instruments.get("data", "")
    response = requests.get(
        f"http://{ip}:31950/modules",
        headers={"opentrons-version": "3"},
        params={"cursor": 0, "pageLength": 0},
    )
    modules: Dict[str, Any] = response.json()
    calibration["Modules"] = modules.get("data", "")
    response = requests.get(
        f"http://{ip}:31950/calibration/status",
        headers={"opentrons-version": "3"},
        params={"cursor": 0, "pageLength": 0},
    )
    deck: Dict[str, Any] = response.json()
    calibration["Deck"] = deck.get("deckCalibration", "")
    save_name = ip + "_calibration.json"
    saved_file_path = os.path.join(storage_directory, save_name)
    json.dump(calibration, open(saved_file_path, mode="w"))
    return saved_file_path, calibration
