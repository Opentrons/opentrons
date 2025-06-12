import google_drive_helper
import os
import configparser
import hashlib
import json
import sys
import pandas as pd
import google_sheets_helper
import re
from datetime import datetime

def get_configs():
    configurations = None
    script_dir = os.path.dirname(os.path.abspath(__file__))
    filename = 'config.ini'
    configs_file = os.path.join(script_dir, filename)
    print(configs_file)
    while not os.path.exists(configs_file):
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

    if configurations['Settings']['local_files']:
        file_path = configurations['Settings']['file_path']
        return(True, file_path, None, None, None)
    else:
        credentials_path = configurations['Drive']['credentials']
        drive_folder = configurations['Drive']['folder']
        email = configurations['Drive']['email']
        sheet = configurations['Drive']['sheet']
        return(False, drive_folder, credentials_path, email, sheet)

def generate_hash(values):
    combined_string = "".join(values)
    hashed_obj = hashlib.sha256(combined_string.encode())
    return hashed_obj.hexdigest()

def append_file(file_name, file_path, file_details, labware_stacked, google_drive=None, axis ="", labware_num=1):
    columns = [
        "Hash_id",
        "Stacker Name",
        "Axis",
        "Serial",
        "Cover?",
        "Labware Name",
        "Test",
        "Labware Num",
        "Labware Stacked",
        "Values",
    ]

    # Attempt to read the existing DataFrame
    try:
        df = pd.read_csv('TOF_raw_data_df.csv')
    except:
        # Create a new DataFrame if the CSV doesn't exist
        df = pd.DataFrame(columns=columns)
    labels = []
    # Download file if google_drive is provided
    if google_drive:
        file_path = google_drive.download_single_file(os.curdir, file_path, file_name, None)
        labels += file_details[:4]
        if 'Baseline' in file_details:
            labels += ['Tip Rack 50 uL']
        else:
            labels += file_details[5:-1]
        # Check if data already exists
        hash_val = generate_hash(labels + [labware_stacked])
        hashes = df['Hash_id']
        if hash_val in hashes:
            print("skipping...")
            return
    else:
        if axis == 'x':
            file_details = file_details[2:3] + ['X-Axis'] + file_details[5:-1] + [labware_num]
        elif axis == 'z':
            file_details = file_details[2:3] + ['Z-Axis']  + file_details[3:5] + file_details[7:-1] + [labware_num]

        labels += file_details[:4]
        if 'Baseline' in file_details:
            labels += ['Tip Rack 50 uL']
        else:
            labels += file_details[5:]
        print(f"Labels: {labels}")
        # Check if data already exists
        hash_val = generate_hash(labels + [labware_stacked])
        hashes = df['Hash_id']
        if hash_val in hashes:
            print("skipping...")
            return
    # Read the downloaded file into a DataFrame
    file_df = pd.read_csv(file_path, header=None)
    bin_labels = ['Time', 'Zone'] + [str(i) for i in range(1, 129)]
    file_df.columns = bin_labels
    matrix = file_df.to_numpy()

    # Prepare a new row with file details
    new_row = {col: None for col in columns}
    for i, col in enumerate(columns[1:-1]):  # Exclude the 'Hash_id' and'Values' column from this loop
        if i < len(labels):
            new_row[col] = labels[i]

    # Add the labware_stacked and matrix to the appropriate columns
    new_row['Hash_id'] = hash_val
    new_row['Labware Stacked'] = labware_stacked
    new_row['Values'] = json.dumps(matrix.tolist())  # Store the matrix as a single entry

    print('adding data')
    new_row_df = pd.DataFrame([new_row])
    df = pd.concat([df, new_row_df], ignore_index=True)

    df.to_csv('TOF_raw_data_df.csv', index=False)

    # Delete file
    os.remove(file_path)
    return new_row

def get_files(credentials_path, drive_folder, email, stacker_configuration=None):
    if stacker_configuration is None:
        stacker_configuration = []  # Initialize it as an empty list on the first call

    google_drive = google_drive_helper.google_drive(credentials_path, drive_folder, email)
    folder_results = google_drive.list_folder(folder=True)
    print(f"Folder results: {folder_results}")
    if folder_results:
        folder_names = folder_results[0]
        folder_paths = folder_results[1]
    else:
        return
    exclude = [
        "Plots",
        "Z-Height-Increase",
    ]

    if folder_paths:
        while folder_paths:
            folder_name = folder_names.pop(0)
            folder_path = folder_paths.pop(0)
            if folder_name not in exclude:
                get_files(credentials_path, folder_path, email, stacker_configuration + [folder_name])
    else:
        files = google_drive.list_folder()
        print(files)
        file_names = files[0]
        file_paths = files[1]
        for name, path in zip(file_names, file_paths):
            index = -1
            print(f"File Name: {name}")
            try:
                index = name.index('LAB')
            except:
                pass
            labware_stacked = name[index+3:index+4]
            append_file(name, path, stacker_configuration, labware_stacked, google_drive=google_drive)

        
def download_df(file_name, credentials_path, sheet_name):
    sheet = google_sheets_helper.google_sheet(credentials_path, sheet_name, 0)
    columns = [
        "Hash_id",
        "Stacker Name",
        "Axis",
        "Serial",
        "Cover?",
        "Labware Name",
        "Test",
        "Labware Num",
        "Labware Stacked",
        "Values",
    ]
    data = sheet.get_all_data(expected_headers=columns)
    data_df = pd.DataFrame(data)
    print(data_df)
    data_df.to_csv('TOF_raw_data_df.csv', index=False)
    
def download_data(file_name, credentials_path, sheet_name):
    # get_files(credentials_path, drive_folder, email)
    download_df(file_name, credentials_path, sheet_name)


def update_sheet(data: dict, sheet_name):
    curr_dir = os.curdir
    try:
        credentials_path = os.path.join(curr_dir, "credentials.json")
        print(credentials_path)
    except FileNotFoundError:
        print(f"Add credentials.json file to: {curr_dir}.")
        sys.exit()
    sheet = google_sheets_helper.google_sheet(credentials_path, sheet_name, 0)
    # hashes = sheet.get_column(1)
    # data_hash = data.get('Hash_id')
    # if data_hash not in hashes:
    values = list(data.values())
    sheet.write_to_row(values, 'TOF_raw_data_df')

def append_df(df, drive_folder_path, data_folder):
    data_path = os.path.join(drive_folder_path, data_folder)
    data_files = os.listdir(data_path)

    for file in data_files:
        full_path = os.path.join(data_path, file)
        if os.path.isdir(full_path):
            stacker_files = os.listdir(full_path)
            for stacker_file in stacker_files:
                if not stacker_file.endswith('.csv'):
                    continue

                # Read the downloaded file into a DataFrame
                csv_file_path = os.path.join(full_path, stacker_file)
                file_df = pd.read_csv(csv_file_path, skiprows=1, header=None)
                bin_labels = ['Time', 'Sample', 'Zone'] + [str(i) for i in range(1, 129)]
                # print(file_df.shape)
                file_df.columns = bin_labels

                # new_row = {col: None for col in columns}
                file_df['Hash_id'] = generate_hash(stacker_file)

                pattern = r"_run-(\d{2}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2})"
                match = re.search(pattern, stacker_file)
                file_df['Date'] = match.group(1)
                
                file_df['Test'] = data_folder

                pattern = r"LW=([^_]+)_"
                match = re.search(pattern, stacker_file)
                file_df['Labware_Name'] = match.group(1)

                pattern = r"FSTA(\d+)"
                match = re.search(pattern, stacker_file)
                file_df['Stacker_SN'] = "FSTA" + match.group(1)

                pattern = r"_(x|z)-axis_"
                match = re.search(pattern, stacker_file)
                file_df['Axis'] = match.group(1)

                if "extend" in stacker_file:
                    file_df['Platform_Position'] = "extend"
                elif "retract" in stacker_file:
                    file_df['Platform_Position'] = "retract"
                else:
                    file_df['Platform_Position'] = "unknown"
                
                pattern = r"labx(\d+)"
                match = re.search(pattern, stacker_file)
                file_df['Labware_Num_X'] = match.group(1)

                pattern = r"labz(\d+)"
                match = re.search(pattern, stacker_file)
                file_df['Labware_Num_Z'] = match.group(1)  

                print(f"Create df for {stacker_file}")
                print(f"--- {file_df.shape}")
                df = pd.concat([df, file_df], ignore_index=True)
    
    return df

def create_df_csv(df_name, drive_folder_path):
    columns = [
        "Hash_id",
        "Date",
        "Test",
        "Labware_Name",
        "Stacker_SN",
        "Axis",
        "Platform_Position",
        "Labware_Num_X",
        "Labware_Num_Z",
        "Sample",
        "Zone",
    ]
    df = pd.DataFrame(columns=columns)
    
    print(os.listdir(drive_folder_path))
    for data_folder in os.listdir(drive_folder_path):
        folder_path = os.path.join(drive_folder_path, data_folder)
        if os.path.isdir(folder_path):
            print(f"Appending data from folder: {data_folder}")
            df = append_df(df, drive_folder_path, data_folder)

    df.to_csv(df_name, index=False)
    print(f"Created {df_name} with shape: {df.shape}")


if __name__ == '__main__':
    local_files = True
    # local_files, drive_folder, credentials_path, email, sheet = get_configs()
    email = input("Enter your email (without @opentrons.com): ")
    email = email + "@opentrons.com"
    drive_folder = f"~/Library/CloudStorage/GoogleDrive-{email}" \
        "/Shared drives/1 - Hardware/1 - Hardware Engineering /1 - NPI Programs" \
            "/23 - Flex Stacker/5 - Testing/DVT Flex Stacker Testing/TOF TEST"

    df_name = 'TOF_raw_data_df.csv'
    df_path = os.path.join(os.curdir, df_name)
    print("Creating Dataframe CSV from Local files")
    create_df_csv(df_name, os.path.expanduser(drive_folder))

    # if(not os.path.exists(df_path)):
    #     print("Dataframe CSV Found")
    #     # df_file = open(df_path, 'w+')
    #     # df_file.flush()
    # else:
    #     print("Dataframe CSV not Found")
    #     if local_files:
    #         print("Creating Dataframe CSV from Local files")
    #         create_df_csv(df_name, drive_folder)
    #     else:
    #         print(drive_folder)
    #         print(credentials_path)
    #         print(email)
    #         download_data(df_name, credentials_path, sheet)

    df = pd.read_csv(df_name)
    stackers = df['Stacker_SN'].unique()
    print(stackers)