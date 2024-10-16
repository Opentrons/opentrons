"""Flex Absorbance Plate Reader Manual QC script

This script will evaluate Byonoy CSV files taken with a Hellma reference plate 
to determine if the data meets specifications.
"""
import csv
import glob
import numpy as np
import collections
import os
import sys

CALIBRATION_SUBDIR = 'ByonoyData/hellma101934'

def convert_read_dictionary_to_array(read_data):
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
    
def read_byonoy_file_to_array(filename):
    """Read a Byonoy endpoint CSV file into a numpy array
    
    Returns a named tuple with a 2D numpy array of shape (8,12) of OD values
    from a Byonoy endpoint CSV file and a 1D numpy array of tolerances (which 
    are present in the reference plate calibration data files).
    
    filename: str
        absolute path and filename of the CSV file to be read
    """
    with open(filename, 'r') as f:
        #print(filename)
        
        f.seek(0)
        file_data = np.genfromtxt(f, usecols=range(1,13), skip_header=1, max_rows=8, delimiter = ',')
        #print(file_data.shape, file_data)
        
        f.seek(0)
        file_tolerance = np.genfromtxt(f, usecols=range(1,13), skip_header=9, max_rows=1, delimiter = ',')
        #print(file_tolerance.shape, file_tolerance)

        File_Values = collections.namedtuple('File_Values', ['data','tolerance'])
        return File_Values(file_data,file_tolerance)

def read_byonoy_directory_to_list(path, slug):
    """Read in all Byonoy endpoint CSV in a particular directory
    
    Returns a list of 2D numpy.array of shape (8,12) and a list of filename 
    strings for all Byonoy endpoint CSV files in a directory with a 
    filename of a specified format.
    
    path: str
        absolute path of the directory containing files
    slug: str
        filename format, to be parsed with glob.glob
    """
    data = []
    filenames = glob.glob(path + '/' + slug + '.csv')
    for filename in filenames:
        this_run = read_byonoy_file_to_array(filename).data
        data.append(this_run)
    
    return data, filenames 

def check_byonoy_data_accuracy(od_list, cal, flipped):
    """Check multiple OD measurements for accuracy
    
    od_list: list of 2D numpy.array of shape (8,12)
        a list of multiple plate readings as returned by read_byonoy_directory_to_list()
    cal: namedtuple
        2D numpy.array of shape (8,12) of calibration values, and 1D 
        numpy.array of tolerances, as returned by read_byonoy_file_to_array
    flipped: bool
        True if reference plate was rotated 180 degrees for measurment
    """
    run_error_cells = []

    # Calculate absolute accuracy tolerances for each cell
    # The last two columns have a higher tolerance per the Byonoy datasheet
    #   because OD>2.0 and wavelength>=450nm on the Hellma plate
    accuracy_tolerances = np.zeros((8,12))
    accuracy_tolerances[:,:10] = cal.data[:,:10]*0.01 + cal.tolerance[:10] + 0.01
    accuracy_tolerances[:,10:] = cal.data[:,10:]*0.015 + cal.tolerance[10:] + 0.01
    
    for run in od_list:
        if (flipped):
            within_tolerance = np.isclose(run, np.rot90(cal.data, 2), atol=np.rot90(accuracy_tolerances, 2))
        else:
           within_tolerance = np.isclose(run, cal.data, atol=accuracy_tolerances)
           
        #print(within_tolerance)
        errors = np.where(within_tolerance==False)
        error_cells = [(chr(ord('@')+errors[0][i]+1) + str(errors[1][i]+1)) for i in range(0, len(errors[0]))]
        run_error_cells.append(error_cells)
        #print(error_cells)
    
    return run_error_cells
    
def check_byonoy_data_repeatability(od_list, cal, flipped):
    """Check multiple OD measurements for repeatability
    
    od_list: list of 2D numpy.array of shape (8,12)
        a list of multiple plate readings as returned by read_byonoy_directory_to_list()
        a list of multiple plate readings as returned by read_byonoy_directory_to_list()
    cal: namedtuple
        2D numpy.array of shape (8,12) of calibration values, and 1D 
        numpy.array of tolerances, as returned by read_byonoy_file_to_array
    flipped: bool
        set to True if reference plate was rotated 180 degrees for measurment
    """
    OD = np.asarray(od_list)
    
    odstdev = np.std(OD, axis=0)
    
    # Calculate repeatability tolerances for each cell in OD
    # The last two columns have a higher tolerance per the Byonoy datasheet
    #   because OD>2.0 and wavelength>=450nm on the Hellma plate
    repeatability_tolerances = np.zeros((8,12))
    repeatability_tolerances[:,:10] = cal.data[:,:10]*0.005 + cal.tolerance[:10] + 0.005
    repeatability_tolerances[:,10:] = cal.data[:,10:]*0.010 + cal.tolerance[10:] + 0.010
    if (flipped):
        repeatability_tolerances = np.rot90(repeatability_tolerances, 2)
    #print(repeatability_tolerances)

    within_tolerance = np.isclose(odstdev, np.zeros((8,12)), atol=repeatability_tolerances)
    
    #print(within_tolerance)
    errors = np.where(within_tolerance==False)
    error_cells = [(chr(ord('@')+errors[0][i]+1) + str(errors[1][i]+1)) for i in range(0, len(errors[0]))]
    return error_cells

def evaluate_dataset(path, slug, cal):
    """Evaluate all Byonoy CSV files in a directory
    
    Reads all Byonoy endpoint CSV files in a directory with a particular
    filename format, compares them to calibration values, and prints
    any errors and pass/fail results.
    
    path: str
        absolute path of the directory containing the data files
    slug: str
        filename format, to be parsed with glob.glob
    cal: namedtuple
        the reference plate calibration values and tolerances,
        returned from read_byonoy_file_to_array()
    """
    run_data = []
    filenames = []
    
    # Use the filename slug to determine if the Hellma plate
    # is rotated or not
    if "_180deg" in slug:
        flipped = True
    elif "_0deg" in slug:
        flipped = False
    else:
        print("Cannot determine reference plate orientation from filename!!!")
        return 
    
    run_data, filenames = read_byonoy_directory_to_list(path, slug)
    
    if (len(run_data) > 0):
        run_error_cells = check_byonoy_data_accuracy(run_data, cal, flipped)
        if (len(run_error_cells) > 0):
            for i, error_cells in enumerate(run_error_cells):
                for cell in error_cells:
                    print("FAIL: Cell " + cell + " out of accuracy spec in " + filenames[i])
        else:
            print("PASS: All cells at this wavelength and orientation meet accuracy specification")
                
        error_cells = check_byonoy_data_repeatability(run_data, cal, flipped)
        if (len(error_cells) > 0):
            for cell in error_cells:
                print("FAIL: Cell " + cell + " is out of repeatability spec")
        else:
            print("PASS: All cells at this wavelength and orientation meet repeatability specification")
    
    return

if __name__ == "__main__":
    # Read in data path
    DATA_DIR = input("Enter CSV file path: ")
    if not os.path.isdir(DATA_DIR):
        print("Directory does not exist!!!")
        sys.exit()
    
    # Read Hellma plate calibration
    cal_450_file = glob.glob('./' + CALIBRATION_SUBDIR + '/hellma_*_450nm.csv')[0]
    cal_650_file = glob.glob('./' + CALIBRATION_SUBDIR + '/hellma_*_650nm.csv')[0]
    cal_450 = read_byonoy_file_to_array(cal_450_file)
    cal_650 = read_byonoy_file_to_array(cal_650_file)
    
    # Evaluate 450nm data
    print("Evaluating 450nm data...")
    path = DATA_DIR
    slug = '*_0deg*450nm'
    evaluate_dataset(path, slug, cal_450)
    slug = '*_180deg*450nm'
    evaluate_dataset(path, slug, cal_450)
    
    # Evaluate 650nm data
    print("Evaluating 650nm data...")
    slug = '*_0deg*650nm'
    evaluate_dataset(path, slug, cal_650)
    slug = '*_180deg*650nm'
    evaluate_dataset(path, slug, cal_650)
    