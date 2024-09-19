"""Plate Reader Functions"""
import argparse
import os
import numpy as np
from typing import Dict, Any

def convert_read_dictionary_to_array(read_data:Dict[str,Any])-> np.ndarray:
    """Convert a dictionary of read results to an array
    
    Converts a dictionary of OD values, as formatted by the Opentrons API's
    plate reader read() function, to a 2D numpy.array of shape (8,12) for 
    further processing.
    
    read_data: dict
        a dictonary of read values with celll numbers for keys, e.g. 'A1'
    """
    data = np.empty((8,12))
    for key, value in read_data.items():
        row_index = ord(key[0]) - ord('A')
        column_index = int(key[1:]) - 1
        data[row_index][column_index] = value

    return data

def check_byonoy_data_accuracy(output: Dict[str, Any], cal, flipped:bool):
    """Check multiple OD measurements for accuracy
    
    od_list: list of 2D numpy.array of shape (8,12)
        a list of multiple plate readings as returned by read_byonoy_directory_to_list()
    cal: namedtuple
        2D numpy.array of shape (8,12) of calibration values, and 1D 
        numpy.array of tolerances, as returned by read_byonoy_file_to_array
    flipped: bool
        True if reference plate was rotated 180 degrees for measurment
    """
    print("entered analysis")
    run_error_cells = []
    cal_data = cal["data"]
    cal_tolerance = cal["tolerance"]
    # Calculate absolute accuracy tolerances for each cell
    # The last two columns have a higher tolerance per the Byonoy datasheet
    #   because OD>2.0 and wavelength>=450nm on the Hellma plate
    accuracy_tolerances = np.zeros((8,12))
    accuracy_tolerances[:,:10] = cal_data[:,:10]*0.01 + cal_tolerance[:10] + 0.01
    accuracy_tolerances[:,10:] = cal_data[:,10:]*0.015 + cal_tolerance[10:] + 0.01
    if (flipped):
        within_tolerance = np.isclose(output, np.rot90(cal_data, 2), atol=np.rot90(accuracy_tolerances, 2))
    else:
        within_tolerance = np.isclose(output, cal_data, atol=accuracy_tolerances)
    #print(within_tolerance)
    errors = np.where(within_tolerance==False)
    error_cells = [(chr(ord('@')+errors[0][i]+1) + str(errors[1][i]+1)) for i in range(0, len(errors[0]))]
    run_error_cells.append(error_cells)    
    return run_error_cells

def read_byonoy_file_to_array(filename)-> Dict[str, Any]:
    """Read a Byonoy endpoint CSV file into a numpy array
    
    Returns a named tuple with a 2D numpy array of shape (8,12) of OD values
    from a Byonoy endpoint CSV file and a 1D numpy array of tolerances (which 
    are present in the reference plate calibration data files).
    
    filename: str
        absolute path and filename of the CSV file to be read
    """
    wavelength = filename.split("nm.csv")[0].split("_")[-1]
    with open(filename, 'r') as f:
        #print(filename)
        
        f.seek(0)
        file_data = np.genfromtxt(f, usecols=range(1,13), skip_header=1, max_rows=8, delimiter = ',')
        #print(file_data.shape, file_data)
        
        f.seek(0)
        file_tolerance = np.genfromtxt(f, usecols=range(1,13), skip_header=9, max_rows=1, delimiter = ',')
        #print(file_tolerance.shape, file_tolerance)

        File_Values = {'wavelength': wavelength,'data': file_data, 'tolerance': file_tolerance}
        return File_Values

def read_hellma_plate_files(storage_directory: str, hellma_plate_number: int)-> None:
    wavelengths = [405, 450, 490, 650]
    file_values = []
    for wave in wavelengths:
        file_name = "_".join(["hellma", str(hellma_plate_number), str(wave)])
        file_name_csv = file_name + "nm.csv"
        try:
            file_path = os.path.join(storage_directory, file_name_csv)
            File_Values = read_byonoy_file_to_array(file_path)
            file_values.append(File_Values)
        except FileNotFoundError:
            print(f"Hellma plate {hellma_plate_number} file at {wave} does not exist in this folder.")
            continue
    return file_values
        

        
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Read storage directory with hellma plate files.")
    parser.add_argument(
        "storage_directory",
        metavar="STORAGE_DIRECTORY",
        type=str,
        nargs=1,
        help="Path to storage directory for hellma plate files.",
    )
    parser.add_argument(
        "hellma_plate_number",
        metavar="HELLMA_PLATE_NUMBER",
        type=int,
        nargs=1,
        help="Hellma Plate Number.",
    )
    args = parser.parse_args()
    storage_directory = args.storage_directory[0]
    hellma_plate_number = args.hellma_plate_number[0]
    read_hellma_plate_files()