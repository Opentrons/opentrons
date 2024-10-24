"""Automate ABR data collection."""
import os
import time
import configparser
import traceback
import sys
from hardware_testing.scripts import ABRAsairScript  # type: ignore
from abr_testing.data_collection import (
    get_run_logs,
    abr_google_drive,
    abr_calibration_logs,
)
from abr_testing.tools import sync_abr_sheet


def run_sync_abr_sheet(
    storage_directory: str, abr_data_sheet: str, room_conditions_sheet: str
) -> None:
    """Sync ABR sheet with temp and lifetime percents."""
    sync_abr_sheet.run(storage_directory, abr_data_sheet, room_conditions_sheet)


def run_temp_sensor(ip_file: str) -> None:
    """Run temperature sensors on all robots."""
    processes = ABRAsairScript.run(ip_file)
    for process in processes:
        process.start()
        time.sleep(20)
    for process in processes:
        process.join()


def get_abr_logs(storage_directory: str, folder_name: str, email: str) -> None:
    """Retrieve run logs on all robots and record missing run logs in google drive."""
    try:
        get_run_logs.run(storage_directory, folder_name, email)
    except Exception as e:
        print("Cannot Get Run Logs", e)
        traceback.print_exc


def record_abr_logs(
    storage_directory: str, folder_name: str, google_sheet_name: str, email: str
) -> None:
    """Write run logs to ABR run logs in sheets."""
    try:
        abr_google_drive.run(storage_directory, folder_name, google_sheet_name, email)
    except Exception as e:
        print(e)


def get_calibration_data(
    storage_directory: str, folder_name: str, google_sheet_name: str, email: str
) -> None:
    """Download calibration logs and write to ABR-calibration-data in sheets."""
    try:
        abr_calibration_logs.run(
            storage_directory, folder_name, google_sheet_name, email
        )
    except Exception as e:
        print("Cannot get calibration data", e)
        traceback.print_exc()


def main(configurations: configparser.ConfigParser) -> None:
    """Main function."""
    ip_file = None
    storage_directory = None
    email = None
    drive_folder = None
    sheet_name = None
    ambient_conditions_sheet = None
    sheet_url = None

    has_defaults = False
    # If default is not specified get all values
    default = configurations["DEFAULT"]
    if len(default) > 0:
        has_defaults = True
    try:
        if has_defaults:
            storage_directory = default["Storage"]
            email = default["Email"]
            drive_folder = default["Drive_Folder"]
            sheet_name = default["Sheet_Name"]
            sheet_url = default["Sheet_Url"]
    except KeyError as e:
        print("Cannot read config file\n" + str(e))

    # Run Temperature Sensors
    if not has_defaults:
        ip_file = configurations["TEMP-SENSOR"]["Robo_List"]
        ambient_conditions_sheet = configurations["TEMP-SENSOR"]["Sheet_Url"]
    print("Starting temp sensors...")
    if ip_file:
        run_temp_sensor(ip_file)
        print("Temp Sensors Started")
    else:
        print("Missing ip_file location, please fix configs")
        sys.exit(1)
    # Get Run Logs and Record
    if not has_defaults:
        storage_directory = configurations["RUN-LOG"]["Storage"]
        email = configurations["RUN-LOG"]["Email"]
        drive_folder = configurations["RUN-LOG"]["Drive_Folder"]
        sheet_name = configurations["RUN-LOG"]["Sheet_Name"]
        sheet_url = configurations["RUN-LOG"]["Sheet_Url"]
    print(sheet_name)
    if storage_directory and drive_folder and sheet_name and email:
        print("Retrieving robot run logs...")
        get_abr_logs(storage_directory, drive_folder, email)
        print("Recording robot run logs...")
        record_abr_logs(storage_directory, drive_folder, sheet_name, email)
        print("Run logs updated")
    else:
        print("Storage, Email, or Drive Folder is missing, please fix configs")
        sys.exit(1)
    # Update Google Sheet with missing temp/rh
    if storage_directory and sheet_url and ambient_conditions_sheet:
        run_sync_abr_sheet(storage_directory, sheet_url, ambient_conditions_sheet)
    # Collect calibration data
    if not has_defaults:
        storage_directory = configurations["CALIBRATION"]["Storage"]
        email = configurations["CALIBRATION"]["Email"]
        drive_folder = configurations["CALIBRATION"]["Drive_Folder"]
        sheet_name = configurations["CALIBRATION"]["Sheet_Name"]
    if storage_directory and drive_folder and sheet_name and email:
        print("Retrieving and recording robot calibration data...")
        get_calibration_data(storage_directory, drive_folder, sheet_name, email)
        print("Calibration logs updated")
    else:
        print(
            "Storage, Email, Drive Folder, or Sheet name is missing, please fix configs"
        )
        sys.exit(1)


if __name__ == "__main__":
    configurations = None
    configs_file = None
    while not configs_file:
        configs_file = input("Please enter path to config.ini: ")
        if os.path.exists(configs_file):
            break
        else:
            configs_file = None
            print("Please enter a valid path")
    try:
        configurations = configparser.ConfigParser()
        configurations.read(configs_file)
    except configparser.ParsingError as e:
        print("Cannot read configuration file\n" + str(e))
    if configurations:
        main(configurations)
