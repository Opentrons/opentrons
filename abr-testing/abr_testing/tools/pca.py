"""Principle Component Analysis."""
from abr_testing.automation import google_sheets_tool
import argparse
from typing import List, Dict, Any
from abr_testing.tools.add_temprh_to_abr import connect_and_download
import os


def pre_processing_data(data:List[Dict[str, Any]] ):
    """Cleaning up data - remove human error runs - remove runs without run id."""
    new_data = []
    for run in data:
        # If there is a run_id and it is not a human error run.
        if (len(run["Run_Id"]) > 1) and (run["Error Level"] != 5):
            new_data.append(run)
    print(new_data.shape)
    # investigate all elements in each feature
    dict_keys = set(new_data[0].keys())
    print(dict_keys)
        
            



if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Performs Principle Component Analysis on given csv."
    )
    parser.add_argument(
        "--abr-data-sheet",
        type=str,
        default="1M6LSLNwvWuHQOwIwUpblF_Eyx4W5y5gXgdU3rjU2XFk",
        help="end of url of main data sheet.",
    )
    parser.add_argument(
        "--storage-directory",
        type=str,
        default="C:/Users/Rhyann Clarke/test_folder",
        help="Path to long term storage directory for run logs.",
    )
    parser.add_argument(
        "--independent-variable",
        type=str,
        help="Independent variable of interest.",
    )
    parser.add_argument(
        "--dvs-to-omit",
        type=List[str],
        help="Variables you do not want to be part of the analysis",
    )
    args = parser.parse_args()
    # Download file of interest
    google_sheet_to_download = {"ABR-run-data", args.abr_data_sheet}
    storage_directory = args.storage_directory
    credentials_path = os.path.join(storage_directory, "credentials.json")
    connect_and_download(google_sheet_to_download, storage_directory)
    google_sheet = google_sheets_tool.google_sheet(credentials_path, "ABR-run-data", 0)
    header_list = google_sheet.get_row(1)

    data = google_sheet.get_all_data(header_list)
    pre_processing_data(data)
