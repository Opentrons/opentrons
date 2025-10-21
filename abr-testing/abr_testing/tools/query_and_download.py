"""Download files from google drive based off string search."""
from abr_testing.automation import google_drive_tool
import argparse
import os
import json
import sys

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Download files based off title search."
    )
    parser.add_argument(
        "storage_directory",
        metavar="STORAGE_DIRECTORY",
        type=str,
        nargs=1,
        help="Path save downloaded files. Contains .json file with query words.",
    )
    parser.add_argument(
        "folder_name",
        metavar="FOLDER_NAME",
        type=str,
        nargs=1,
        help="Google Drive folder name. Open desired folder and copy string after drive/folders/.",
    )
    parser.add_argument(
        "email", metavar="EMAIL", type=str, nargs=1, help="opentrons gmail."
    )
    args = parser.parse_args()
    folder_name = args.folder_name[0]
    email = args.email[0]
    storage_directory = args.storage_directory[0]

    search_file_path = os.path.join(storage_directory, "search_words.json")
    try:
        search_file = json.load(open(search_file_path))
    except FileNotFoundError:
        print("Add .json file with search words formatted in a list.")
    try:
        credentials_path = os.path.join(storage_directory, "credentials.json")
    except FileNotFoundError:
        print(f"Add credentials.json file to: {storage_directory}.")
        sys.exit()
    google_drive = google_drive_tool.google_drive(credentials_path, folder_name, email)
    print("Connected to google drive.")
    search_lists = search_file["search_words"]
    found_files = google_drive.search_folder(search_lists, folder_name)
    google_drive.download_files(found_files, storage_directory)
