from abr_testing.automation import google_drive_tool
import argparse
import sys
import os

if __name__ == "__main__":
    """Get run logs."""
    parser = argparse.ArgumentParser(description="Pulls run logs from ABR robots.")
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
        "email", metavar="EMAIL", type=str, nargs=1, help="opentrons gmail."
    )
    args = parser.parse_args()
    storage_directory = args.storage_directory[0]
    folder_name = args.folder_name[0]
    email = args.email[0]
    try:
        credentials_path = os.path.join(storage_directory, "credentials.json")
    except FileNotFoundError:
        print(f"Add credentials.json file to: {storage_directory}.")
        sys.exit()
    google_drive = google_drive_tool.google_drive(credentials_path, folder_name, email)
    google_drive.create_folder("test folder")