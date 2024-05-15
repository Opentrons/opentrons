"""Get Unique LPC Values from Run logs."""
import os
import argparse
from typing import Any, Dict, List
from abr_testing.automation import google_sheets_tool
import sys

# TODO: Remove duplicate rows
def identify_duplicate_data(all_data):
    """Determine unique sets of data."""
    seen = set()
    new_values = []
    for row in all_data:
        key = (row["Robot"], row["Errors"], row["Slot"], row["Module"], row["Adapter"], row["X"], row["Y"], row["Z"])
        if key not in seen:
            seen.add(key)
            new_values.append(row)
    return new_values

def update_sheet_with_new_values(new_values):
    """Update sheet with unique data sets only."""
    google_sheet_lpc.clear()
    headers = list(new_values[0].keys())
    data = [headers] + [[row[col] for col in headers] for row in new_values]
    google_sheet_lpc.update(data)


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
    sheet_data = google_sheet_lpc.get_all_data()
    print(len(sheet_data))
    new_values = identify_duplicate_data(sheet_data)
    print(len(new_values))
    update_sheet_with_new_values(new_values)
    
    num_of_rows = len(google_sheet_lpc.get_all_data())
    # Create graph
    graph_title = "ABR LPC"
    x_axis_title = "X Offset (mm)"
    y_axis_title = "Y Offset (mm)"
    titles = [graph_title, x_axis_title, y_axis_title]
    series = [
        {"sheetId": 0,
         "startRowIndex": 0,
         "endRowIndex": num_of_rows,
         "startColumnIndex": 29,
         "endColumnIndex": 30}
    ]
    spreadsheet_id = "1m9c3Ql2Uez4MC_aLayeUX6YO7WMkNA-4B5xk_w8zJc4"
    google_sheet_lpc.create_line_chart(titles, series, spreadsheet_id)
