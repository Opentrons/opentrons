"""Automated LPC Data Analysis."""
import os
import argparse
from abr_testing.automation import google_sheets_tool
import sys


def remove_duplicate_data() -> None:
    """Determine unique sets of data."""
    seen = set()
    new_values = []
    row_indices = []
    sheet_data = google_sheet_lpc.get_all_data()
    for i, row in enumerate(sheet_data):
        key = (
            row["Robot"],
            row["Software Version"],
            row["Errors"],
            row["Slot"],
            row["Module"],
            row["Adapter"],
            row["X"],
            row["Y"],
            row["Z"],
        )

        if key not in seen:
            seen.add(key)
            new_values.append(row)
        else:
            row_indices.append(i)
    if len(row_indices) > 0:
        google_sheet_lpc.batch_delete_rows(row_indices)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Read run logs on google drive.")
    parser.add_argument(
        "storage_directory",
        metavar="STORAGE_DIRECTORY",
        type=str,
        nargs=1,
        help="Path to long term storage directory for run logs.",
    )
    args = parser.parse_args()
    storage_directory = args.storage_directory[0]
    try:
        credentials_path = os.path.join(storage_directory, "credentials.json")
    except FileNotFoundError:
        print(f"Add credentials.json file to: {storage_directory}.")
        sys.exit()
    google_sheet_lpc = google_sheets_tool.google_sheet(credentials_path, "ABR-LPC", 0)
    print(len(google_sheet_lpc.get_all_data()))
    remove_duplicate_data()
    num_of_rows = print(len(google_sheet_lpc.get_all_data()))
    # TODO: automate data analysis
