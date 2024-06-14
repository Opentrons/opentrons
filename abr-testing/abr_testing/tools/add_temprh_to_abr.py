"""Add temperature and humidity data to ABR-run-data sheet."""

from abr_testing.automation import google_sheets_tool
from abr_testing.automation import google_drive_tool
import argparse
import csv
import sys
import os
from typing import Dict

def connect_and_download(sheets: Dict[str, str], storage_directory: str)-> str:
    """Connect to google sheet and download."""
    try:
        credentials_path = os.path.join(storage_directory, "credentials.json")
    except FileNotFoundError:
        print(f"Add credentials.json file to: {storage_directory}.")
        sys.exit()
    for sheet in sheets:
        gs_data_sheet = google_sheets_tool.google_sheet(
        credentials_path, sheet, 0
        )
        
        

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description = "Reads ABR room conditions sheets and adds corresponding values to ABR data sheet.")
    parser.add_argument("abr_data_sheet_id",
                        metavar = "ABR_DATA_SHEET",
                        type = str,
                        nargs = 1,
                        default = "1M6LSLNwvWuHQOwIwUpblF_Eyx4W5y5gXgdU3rjU2XFk",
                        help = "end of url of main data sheet.")
    parser.add_argument("room_conditions_id",
                        metavar= "ROOM_CONDITIONS_SHEET",
                        type = str,
                        default ="1cIjSvK_mPCq4IFqUPB7SgdDuuMKve5kJh0xyH4znAd0",
                        help = "end fo url of ambient conditions data sheet"
    )
    parser.add_argument(
        "storage_directory",
        metavar="STORAGE_DIRECTORY",
        type=str,
        nargs=1,
        help="Path to long term storage directory for run logs.",
    )
    args = parser.parse_args()
    google_sheets_to_download = {"ABR-data-sheet": args.abr_data_sheet[0], "ABR-Ambient-Conditions": args.room_conditions_sheet[0]}
    storage_directory = args.storage_directory[0]