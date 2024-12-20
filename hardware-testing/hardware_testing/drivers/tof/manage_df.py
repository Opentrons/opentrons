import google_drive_helper
import os
import configparser
import hashlib
import json
import sys
import pandas as pd
import google_sheets_helper

def get_configs():
    configurations = None
    configs_file = None
    while not configs_file:
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
    credentials_path = configurations['Drive']['credentials']
    drive_folder = configurations['Drive']['folder']
    email = configurations['Drive']['email']
    sheet = configurations['Drive']['sheet']
    return(drive_folder, credentials_path, email, sheet)

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



if __name__ == '__main__':
    drive_folder, credentials_path, email, sheet = get_configs()
    df_name = 'TOF_raw_data_df.csv'
    df_path = os.path.join(os.curdir, df_name)
    if(not os.path.exists(df_path)):
       df_file = open(df_path, 'w+')
       df_file.flush()
    print(drive_folder)
    print(credentials_path)
    print(email)
    download_data(df_name, credentials_path, sheet)
    df = pd.read_csv(df_name)
    stackers = df['Stacker Name']
    print(stackers)