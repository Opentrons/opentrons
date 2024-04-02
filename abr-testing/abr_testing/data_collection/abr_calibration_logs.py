"""Get Calibration logs from robots."""
from typing import Dict, Any, List
import argparse
import os
import json
import gspread  # type: ignore[import]
import sys
from abr_testing.data_collection import read_robot_logs
from abr_testing.automation import google_drive_tool, google_sheets_tool


def check_for_duplicates(
    sheet_location: str,
    google_sheet: Any,
    col_1: int,
    col_2: int,
    row: List[str],
    headers: List[str],
) -> List[str]:
    """Check google sheet for duplicates."""
    serials = google_sheet.get_column(col_1)
    modify_dates = google_sheet.get_column(col_2)
    for serial, modify_date in zip(serials, modify_dates):
        if row[col_1 - 1] == serial and row[col_2 - 1] == modify_date:
            print(f"Skipped row{row}. Already on Google Sheet.")
            continue
    read_robot_logs.write_to_sheets(sheet_location, google_sheet, row, headers)
    return row


def upload_calibration_offsets(
    calibration: Dict[str, Any], storage_directory: str
) -> None:
    """Upload calibration data to google_sheet."""
    # Common Headers
    headers_beg = list(calibration.keys())[:4]
    headers_end = list(["X", "Y", "Z", "lastModified"])
    # INSTRUMENT SHEET
    instrument_headers = (
        headers_beg + list(calibration["Instruments"][0].keys())[:7] + headers_end
    )
    local_instrument_file = google_sheet_name + "-Instruments"
    instrument_sheet_location = read_robot_logs.create_abr_data_sheet(
        storage_directory, local_instrument_file, instrument_headers
    )
    # INSTRUMENTS DATA
    instruments = calibration["Instruments"]
    for instrument in range(len(instruments)):
        one_instrument = instruments[instrument]
        x = one_instrument["data"]["calibratedOffset"]["offset"].get("x", "")
        y = one_instrument["data"]["calibratedOffset"]["offset"].get("y", "")
        z = one_instrument["data"]["calibratedOffset"]["offset"].get("z", "")
        modified = one_instrument["data"]["calibratedOffset"].get("last_modified", "")
        instrument_row = (
            list(calibration.values())[:4]
            + list(one_instrument.values())[:7]
            + list([x, y, z, modified])
        )
        check_for_duplicates(
            instrument_sheet_location,
            google_sheet_instruments,
            8,
            15,
            instrument_row,
            instrument_headers,
        )
    # MODULE SHEET
    if len(calibration.get("Modules", "")) > 0:
        module_headers = (
            headers_beg + list(calibration["Modules"][0].keys())[:7] + headers_end
        )
        local_modules_file = google_sheet_name + "-Modules"
        modules_sheet_location = read_robot_logs.create_abr_data_sheet(
            storage_directory, local_modules_file, module_headers
        )
        # MODULES DATA
        modules = calibration["Modules"]
        for module in range(len(modules)):
            one_module = modules[module]
            x = one_module["moduleOffset"]["offset"].get("x", "")
            y = one_module["moduleOffset"]["offset"].get("y", "")
            z = one_module["moduleOffset"]["offset"].get("z", "")
            modified = one_module["moduleOffset"].get("last_modified", "")
            module_row = (
                list(calibration.values())[:4]
                + list(one_module.values())[:7]
                + list([x, y, z, modified])
            )
            check_for_duplicates(
                modules_sheet_location,
                google_sheet_modules,
                8,
                15,
                module_row,
                module_headers,
            )
    # DECK SHEET
    local_deck_file = google_sheet_name + "-Deck"
    deck_headers = headers_beg + list(["pipetteCalibratedWith", "Slot"]) + headers_end
    deck_sheet_location = read_robot_logs.create_abr_data_sheet(
        storage_directory, local_deck_file, deck_headers
    )
    # DECK DATA
    deck = calibration["Deck"]
    slots = ["D3", "D1", "A1"]
    deck_modified = deck["data"].get("lastModified", "")
    pipette_calibrated_with = deck["data"].get("pipetteCalibratedWith", "")
    for i in range(len(deck["data"]["matrix"])):
        coords = deck["data"]["matrix"][i]
        x = coords[0]
        y = coords[1]
        z = coords[2]
        deck_row = list(calibration.values())[:4] + list(
            [pipette_calibrated_with, slots[i], x, y, z, deck_modified]
        )
        check_for_duplicates(
            deck_sheet_location, google_sheet_deck, 6, 10, deck_row, deck_headers
        )


if __name__ == "__main__":
    """Get calibration logs."""
    parser = argparse.ArgumentParser(
        description="Pulls calibration logs from ABR robots."
    )
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
        help="Google Drive folder name. Open desired folder and copy string after drive/folders/.",
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
    parser.add_argument(
        "ip_or_all",
        metavar="IP_OR_ALL",
        type=str,
        nargs=1,
        help="Enter 'ALL' to read IPs.json or type full IP address of 1 robot.",
    )
    args = parser.parse_args()
    storage_directory = args.storage_directory[0]
    folder_name = args.folder_name[0]
    google_sheet_name = args.google_sheet_name[0]
    ip_or_all = args.ip_or_all[0]
    email = args.email[0]
    # Connect to google drive.
    try:
        credentials_path = os.path.join(storage_directory, "credentials.json")
    except FileNotFoundError:
        print(f"Add credentials.json file to: {storage_directory}.")
        sys.exit()
    try:
        google_drive = google_drive_tool.google_drive(
            credentials_path, folder_name, email
        )
        # Upload calibration logs to google drive.
        print("Connected to google drive.")
    except json.decoder.JSONDecodeError:
        print(
            "Credential file is damaged. Get from https://console.cloud.google.com/apis/credentials"
        )
        sys.exit()
    # Connect to google sheet
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
    if ip_or_all == "ALL":
        ip_address_list = ip_file["ip_address_list"]
        for ip in ip_address_list:
            saved_file_path, calibration = read_robot_logs.get_calibration_offsets(
                ip, storage_directory
            )
            upload_calibration_offsets(calibration, storage_directory)
    else:
        saved_file_path, calibration = read_robot_logs.get_calibration_offsets(
            ip_or_all, storage_directory
        )
        upload_calibration_offsets(calibration, storage_directory)

    google_drive.upload_missing_files(storage_directory)
