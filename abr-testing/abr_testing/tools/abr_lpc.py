"""Automated LPC Data Analysis."""
import os
import argparse
from abr_testing.automation import google_sheets_tool
import sys
import pandas as pd


def connect_calibration_and_lpc(
    df_calibration: pd.DataFrame, df_lpc: pd.DataFrame
) -> pd.DataFrame:
    """Match up calibration data to lpc data based on robot and date."""
    # Filter to only include pipettes
    df_cal_pipette = df_calibration[df_calibration["instrumentType"] == "pipette"]
    robot_names = df_cal_pipette["Robot"].unique()
    merged_rows = []
    for robot in robot_names:
        print(f"ANALYZING ROBOT: {robot}")
        df_cal_robot = df_cal_pipette[df_cal_pipette["Robot"] == robot]
        df_lpc_robot = df_lpc[df_lpc["Robot"] == robot]
        dates_lpc = df_lpc_robot["createdAt"]
        for date in dates_lpc:
            # Go through unique created dates of LPC datframe
            row_index = df_lpc_robot.index[df_lpc_robot["createdAt"] == date].tolist()[
                0
            ]
            if not row_index:
                continue
            # Find date that is most recently before date of createdAt LPC
            prior_cals = df_cal_robot[df_cal_robot["lastModified"] <= date]
            if prior_cals.empty:
                continue
            # Get lowest date per instrument
            # LEFT MOUNT
            left_pipette = prior_cals[prior_cals["mount"] == "left"]
            min_left_date = left_pipette["lastModified"].min()
            left_pipette_min_df = left_pipette[
                left_pipette["lastModified"] == min_left_date
            ]
            try:
                left_serial = left_pipette_min_df["serialNumber"].iloc[0]
            except IndexError:
                # No left pipette
                left_serial = ""
            # RIGHT MOUNT
            right_pipette = prior_cals[prior_cals["mount"] == "right"]
            min_right_date = right_pipette["lastModified"].min()
            right_pipette_min_df = right_pipette[
                right_pipette["lastModified"] == min_right_date
            ]
            if left_serial.startswith("P1"):
                calibration_of_interest = left_pipette_min_df
            else:
                calibration_of_interest = right_pipette_min_df
            if calibration_of_interest.empty:
                continue
            cali_to_add = calibration_of_interest[
                ["X", "Y", "Z", "serialNumber", "lastModified"]
            ]
            cali_to_add = cali_to_add.rename(
                columns={
                    "X": "X_cal",
                    "Y": "Y_cal",
                    "Z": "Z_cal",
                    "lastModified": "lastModified_cal",
                }
            )
            # filter lpc data frame to only include the date.
            lpc_to_add_to = df_lpc_robot[df_lpc_robot["createdAt"] == date]
            # then add calibration columns to each row in that data frame.
            for index, row in lpc_to_add_to.iterrows():
                df = pd.DataFrame([row])
                merged_df = df.join(cali_to_add)
                merged_rows.append(merged_df)
    # Concatenate all merged rows into a single DataFrame
    if merged_rows:
        merged_df_final = pd.concat(merged_rows, ignore_index=True)
        # Save all merged LPC and calibration data to a local .csv
        merged_df_final.to_csv("Merged LPC and Calibration Data.csv", index=False)
    return merged_df_final


def standardize_categorical_data(df: pd.DataFrame) -> pd.DataFrame:
    """Replaces strings with numberical value."""
    columns = ["Robot", "Labware Type", "Module", "Adapter", "Slot"]
    for col in columns:
        df = df.copy()
        new_column_name = col + "ID"
        df.loc[:, col] = df[col].replace("", None)
        labels, unique_values = pd.factorize(df[col])
        df.loc[:, new_column_name] = labels
    return df


def remove_duplicate_data(df: pd.DataFrame) -> pd.DataFrame:
    """Determine unique sets of data."""
    len_before = len(df)
    column_for_duplicate_removal = [
        "Robot",
        "Software Version",
        "createdAt",
        "Errors",
        "Slot",
        "Labware Type",
        "X",
        "Y",
        "Z",
    ]
    df_no_duplicates = df.drop_duplicates(subset=column_for_duplicate_removal)
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
    google_sheet_calibration = google_sheets_tool.google_sheet(
        credentials_path, "ABR-Calibration-Data", 0
    )
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
