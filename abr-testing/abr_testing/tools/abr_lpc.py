"""Automated LPC Data Analysis."""
import os
import argparse
from abr_testing.automation import google_sheets_tool
import sys
import pandas as pd
from typing import List, Dict, Any
    
def connect_calibration_and_lpc(df_calibration:pd.DataFrame, df_lpc: pd.DataFrame)-> pd.DataFrame:
    """Match up calibration data to lpc data based on robot and date."""
    # Filter to only include pipettes
    df_cal_pipette = df_calibration[df_calibration["instrumentType"] == "pipette"]
    robot_names = df_cal_pipette["Robot"].unique()
    df_lpc_copy = df_lpc.copy()
    for robot in robot_names:
        df_cal_robot = df_cal_pipette[df_cal_pipette["Robot"] == robot]
        df_lpc_robot = df_lpc[df_lpc["Robot"] == robot]
        dates_lpc = df_lpc_robot["createdAt"]
        for date in dates_lpc:
            row_index = df_lpc_robot.index[df_lpc_robot["createdAt"] == date].tolist()[0]
            print(row_index)
            if not row_index:
                continue
            # Find date that is most recently before date of createdAt LPC
            prior_cals = df_cal_robot[df_cal_robot["lastModified"] <= date]
            # Get lowest date per instrument
            prior_cal_instruments = prior_cals["serialNumber"].unique()
            if len(prior_cals) < 1:
                print("No date match found.")
                continue
            else:
                final_cal = prior_cals[prior_cals["mount"] == "left"]
                if len(final_cal) == 1:
                    prior_cal_instrument = final_cal
                else:
                    prior_cal_instrument = prior_cals[prior_cals["mount"] == "right"]
                min_date = prior_cal_instrument["lastModified"].min()
                print(f"Min date: {min_date}")
                instrument_cal = prior_cal_instrument[prior_cal_instrument["lastModified"] == min_date]
                cali_to_add = instrument_cal[["X", "Y", "Z", "serialNumber", "lastModified"]]
                cali_to_add = cali_to_add.rename(columns ={"X": "X_cal", "Y": "Y_cal", "Z": "Z_cal", "lastModified": "lastModified_cal"})
                df_lpc_copy = pd.concat([df_lpc_copy.iloc[row_index, :],cali_to_add], axis = 1)
                print("/n------")
                print(df_lpc_copy.loc[row_index, :])
                print("/n--------------------")
                print(cali_to_add)
                print("/n--------------------")
                print(df_lpc_copy.iloc[row_index:])
                print("/n--------------------")

                con = input("continue?")
                
                if con == "yes":
                    continue
            name = "test_"+robot+".csv"
            df_lpc_copy.to_csv(name, index = False)

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
    
    # Remove duplicates from LPC
    df_no_duplicates = remove_duplicate_data(df_lpc_data)
    
    # Match up LPC and calibration dates
    connect_calibration_and_lpc(df_calibration_data, df_lpc_data)
    # Standardize categorical data
    df_categorized = standardize_categorical_data(df_no_duplicates)
    # Determine correlation
    
