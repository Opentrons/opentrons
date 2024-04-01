"""Get Calibration logs from robots."""
from typing import Tuple, Dict, Any
import argparse
import os
from datetime import datetime
import json
import requests
import gspread  # type: ignore[import]
import sys
from abr_testing.data_collection import read_robot_logs
from abr_testing.automation import google_drive_tool, google_sheets_tool

def check_for_duplicates(google_sheet, col_1, col_2, row):
    """Check google sheet for duplicates."""
    # TODO: check google sheet for duplicates and do not add
    serials = google_sheet.get_column(col_1)
    modify_dates = google_sheet.get_column(col_2)
    for serial, modify_date in zip(serials, modify_dates):
        if row[col_1 - 1] == serial and row[col_2 - 1] == modify_date:
            return
    google_sheet.write_to_row(row)
    
def upload_calibration_offsets(calibration: Dict[str, Any], storage_directory: str):
    """Upload calibration data to google_sheet."""
    headers_beg = list(calibration.keys())[:4]
    headers_end = list(["X", "Y", "Z", "lastModified"])
    instruments = calibration["Instruments"]
    instrument_headers = headers_beg + list(calibration["Instruments"][0].keys())[:7] + headers_end
    google_sheet_instruments.write_header(instrument_headers)
    # Instruments
    for instrument in range(len(instruments)):
        one_instrument = instruments[instrument]
        x = one_instrument["data"]["calibratedOffset"]["offset"].get("x", "")
        y = one_instrument["data"]["calibratedOffset"]["offset"].get("y", "")
        z = one_instrument["data"]["calibratedOffset"]["offset"].get("z", "")
        modified = one_instrument["data"]["calibratedOffset"].get("last_modified", "")
        instrument_row = list(calibration.values())[:4] + list(one_instrument.values())[:7] + list([x, y, z, modified])
        check_for_duplicates(google_sheet_instruments, 8, 15, instrument_row)
    # Modules
    module_headers = headers_beg + list(calibration["Modules"][0].keys())[:7] + headers_end
    google_sheet_modules.write_header(module_headers)
    modules = calibration["Modules"]
    for module in range(len(modules)):
        one_module = modules[module]
        x = one_module["moduleOffset"]["offset"].get("x", "")
        y = one_module["moduleOffset"]["offset"].get("y", "")
        z = one_module["moduleOffset"]["offset"].get("z", "")
        modified = one_module["moduleOffset"].get("last_modified", "")
        module_row = list(calibration.values())[:4] + list(one_module.values())[:7] + list([x, y, z, modified])
        check_for_duplicates(google_sheet_modules, 8, 15, module_row)
    # Deck
    deck = calibration["Deck"]
    deck_headers = headers_beg + list(["pipetteCalibratedWith", "Slot"]) + headers_end
    slots = ["D3", "D1", "A1"]
    deck_modified = deck["data"].get("lastModified", "")
    pipette_calibrated_with = deck["data"].get("pipetteCalibratedWith", "")
    google_sheet_deck.write_header(deck_headers)
    for i in range(len(deck["data"]["matrix"])):
        coords = deck["data"]["matrix"][i]
        x = coords[0]
        y = coords[1]
        z = coords[2]
        deck_row = list(calibration.values())[:4] +  list([pipette_calibrated_with, slots[i], x, y, z, deck_modified])
        check_for_duplicates(google_sheet_deck, 6, 10, deck_row)

def get_calibration_offsets(ip: str) -> Tuple[str, Dict[str, Any]]:
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
        params={"cursor": 0, "pageLength":0}
    )
    response = response.json()
    calibration["Instruments"] = response.get("data", "")
    response = requests.get(
        f"http://{ip}:31950/modules",
        headers={"opentrons-version": "3"},
        params={"cursor": 0, "pageLength":0}
    )
    response = response.json()
    calibration["Modules"] = response.get("data", "")
    response = requests.get(
        f"http://{ip}:31950/calibration/status",
        headers={"opentrons-version": "3"},
        params={"cursor": 0, "pageLength":0})
    response = response.json()
    calibration["Deck"] = response.get("deckCalibration", "")
    saved_file_path = read_robot_logs.save_run_log_to_json(ip, calibration, storage_directory)
    return saved_file_path, calibration
        
        
if __name__ == "__main__":
    """Get calibration logs."""
    parser = argparse.ArgumentParser(description="Pulls calibration logs from ABR robots.")
    parser.add_argument(
        "storage_directory",
        metavar="STORAGE_DIRECTORY",
        type=str,
        nargs=1,
        help="Path to long term storage directory for run logs.",
    )
    parser.add_argument(
        "folder_name",
        metavar="FOLDER_NAME",
        type=str,
        nargs=1,
        help="Google Drive folder name.",
    )
    parser.add_argument(
        "google_sheet_name",
        metavar="GOOGLE_SHEET_NAME",
        type=str,
        nargs=1,
        help="Google sheet name.",
    )
    args = parser.parse_args()
    storage_directory = args.storage_directory[0]
    folder_name = args.folder_name[0]
    google_sheet_name = args.google_sheet_name[0]
    parent_folder = False
    # Connect to google drive.
    try:
        credentials_path = os.path.join(storage_directory, "credentials.json")
    except FileNotFoundError:
        print(f"Add credentials.json file to: {storage_directory}.")
        sys.exit()
    try:
        google_drive = google_drive_tool.google_drive(
            credentials_path, folder_name, parent_folder
        )
        print("Connected to google drive.")
    except json.decoder.JSONDecodeError:
        print(
            "Credential file is damaged. Get from https://console.cloud.google.com/apis/credentials"
        )
        sys.exit()
    # Connect to google sheet.
    try:
        google_sheet_instruments = google_sheets_tool.google_sheet(
            credentials_path, google_sheet_name, 0
        )
        google_sheet_modules = google_sheets_tool.google_sheet(
            credentials_path, google_sheet_name, 1
        )
        google_sheet_deck = google_sheets_tool.google_sheet(
            credentials_path, google_sheet_name, 2
        )
        print(f"Connected to google sheet: {google_sheet_name}")
    except gspread.exceptions.APIError:
        print("ERROR: Check google sheet name. Check credentials file.")
        sys.exit()
    ip_json_file = os.path.join(storage_directory, "IPs.json")
    try:
        ip_file = json.load(open(ip_json_file))
    except FileNotFoundError:
        print(f"Add .json file with robot IPs to: {storage_directory}.")
        sys.exit()
    ip_address_list = ip_file["ip_address_list"]
    for ip in ip_address_list:
        saved_file_path, calibration = get_calibration_offsets(ip)
        google_drive.upload_file(saved_file_path)
    upload_calibration_offsets(calibration, storage_directory)
    