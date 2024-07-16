"""Automated LPC Data Analysis."""
import os
import argparse
from abr_testing.automation import google_sheets_tool
import sys
import pandas as pd

def standardize_categorical_data(df: pd.DataFrame)-> pd.DataFrame:
    """Replaces strings with numberical value."""
    columns = ["Robot", "Labware Type", "Module", "Adapter", "Slot"]
    for col in columns:
        df = df.copy()
        new_column_name = col + "ID"
        df.loc[:,col] = df[col].replace("",None)
        labels, unique_values = pd.factorize(df[col])
        df.loc[:,new_column_name] = labels
    return df

def remove_duplicate_data(df: pd.DataFrame) -> pd.DataFrame:
    """Determine unique sets of data."""
    len_before = len(df)
    column_for_duplicate_removal =["Robot", "Software Version", "createdAt", "Errors", "Slot", "Labware Type", "X", "Y", "Z"]
    df_no_duplicates = df.drop_duplicates(subset = column_for_duplicate_removal)
    len_after = len(df_no_duplicates)
    print(f"Length before: {len_before}. Length after: {len_after}")
    return df_no_duplicates
    
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
    # Connect to LPC google sheet
    google_sheet_lpc = google_sheets_tool.google_sheet(credentials_path, "ABR-LPC", 0)
    headers = google_sheet_lpc.get_row(1)
    all_lpc_data = google_sheet_lpc.get_all_data(headers)    
    df_lpc_data = pd.DataFrame(all_lpc_data)
    
    # Connect to calibration sheet
    google_sheet_calibration = google_sheets_tool.google_sheet(credentials_path, "ABR-Calibration-Data", 0)
    headers = google_sheet_calibration.get_row(1)
    all_calibration_data = google_sheet_calibration.get_all_data(headers)    
    df_calibration_data = pd.DataFrame(all_calibration_data)
    
    # Clean up data
    df_no_duplicates = remove_duplicate_data(df_lpc_data)
    df_categorized = standardize_categorical_data(df_no_duplicates)
    # Match up LPC and calibration dates
    
    # Determine correlation
    
