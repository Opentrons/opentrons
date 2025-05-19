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
from datetime import datetime
import re

# Script Parameters
KINETIC = True  # Set to True if reading Kinetic files, False if reading Endpoint files
CALIBRATION_SUBDIR = 'ByonoyData/hellma102934'  # relative path of the Hellma plate value CSV files
dic = {'DataTime': '', 'SN': '', '450Accuracy': '','450Repeatability': '', '650Accuracy': '','650Repeatability': ''}

def convert_read_dictionary_to_array(read_data):
    """Convert a dictionary of read results to an array
    
    Converts a dictionary of OD values, as formatted by the Opentrons API's
    plate reader read() function, to a 2D numpy.array of shape (8,12) for 
    further processing.
    
    read_data: dict
        a dictonary of read values with celll numbers for keys, e.g. 'A1'
    """
    data = np.empty((8,12))      # 创建空数组[8][12]
    for key, value in read_data.items(): #遍历字典，获取字典的健和值
        row_index = ord(key[0]) - ord('A') #将字符key[0]转换为其在字母表中的索引。ord()函数用于获取字符的ASCII码。
        column_index = int(key[1:]) - 1  #获取列的索引，Excel中，列的编号从1开始。
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
    with open(filename, 'r', encoding='utf-8') as f:
        #print(filename)
        
        f.seek(0)   #文件的读取从文件开头开始算起
        file_data = np.genfromtxt(f, usecols=range(1,13), skip_header=1, max_rows=8, delimiter = ',')  #表示从文件f中读取数据，跳过第一行，提取第2到第12列，最多读取8行数据，使用逗号作为列分隔符。
        #print(file_data.shape, file_data)
        
        f.seek(0)
        file_tolerance = np.genfromtxt(f, usecols=range(1,13), skip_header=9, max_rows=1, delimiter = ',') #表示从文件f中读取数据，跳过第一行，提取第2到第12列，跳过前9行只读取一行数据，使用逗号作为列分隔符。
        #print(file_tolerance.shape, file_tolerance)

        File_Values = collections.namedtuple('File_Values', ['data','tolerance']) #创建具名元组
        return File_Values(file_data,file_tolerance)

def read_byonoy_kinetic_to_list(filename):
    """Read a Byonoy kinetic CSV file into a list of numpy arrayy
    
    Returns a list of 2D numpy.array of shape (8,12) of OD values
    from a Byonoy kinetic CSV file.
    
    filename: str
        absolute path and filename of the CSV file to be read
    """
    with open(filename, 'r') as f:
        data = []
        
        offset = 13
        for i in range(offset+1,offset+5):    #从14到18开始操作
            f.seek(0)
            sample_row = np.genfromtxt(f, usecols=range(1,97), skip_header=i, max_rows=1, delimiter=',')#您选择了从第i行开始，读取1到96列的数据，并且只读取一行
            #print(sample_row)
            sample_data = np.reshape(sample_row, (8,12)) #将sample_row数组重新调整为一个8行12列的二维数组。
            #print(sample_data)
            data.append(sample_data)
        
        #print(data)
        return data
    
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
    filenames = glob.glob(path + '/' + slug + '.csv') #是使用 glob 模块来查找与指定路径和文件名模式匹配的 .csv 文件
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
    #print(cal)
    accuracy_tolerances = np.zeros((8,12))   #使用 NumPy 创建一个 8 行 12 列的全零二维数组
    accuracy_tolerances[:,:10] = cal.data[:,:10]*0.01 + cal.tolerance[:10] + 0.01  #将cal.data中前10列的值乘以0.01，然后加上cal.tolerance中的前10项，再加上0.01
    accuracy_tolerances[:,10:] = cal.data[:,10:]*0.015 + cal.tolerance[10:] + 0.01 #将某个数据数组（cal.data）从第11列开始的数据，按照一定的公式进行处理，计算出对应的准确度公差（accuracy_tolerances）。具体计算方法为将从第11列开始的数值乘以0.015，然后再加上对应的公差值和一个0.01的常数。
    
    for run in od_list:
        if (flipped):
            within_tolerance = np.isclose(run, np.rot90(cal.data, 2), atol=np.rot90(accuracy_tolerances, 2)) #np.isclose() 函数用于比较两个数组是否在给定的公差内相近。首先，将 cal.data 数组旋转 180 度（使用 np.rot90()），然后与 run 数组进行比较，公差由旋转后的 accuracy_tolerances 数组提供。
        else:
           within_tolerance = np.isclose(run, cal.data, atol=accuracy_tolerances)
           
        #print(within_tolerance)
        errors = np.where(within_tolerance==False)  #找到为false的索引
        error_cells = [(chr(ord('@')+errors[0][i]+1) + str(errors[1][i]+1)) for i in range(0, len(errors[0]))]
        if len(error_cells):
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

def evaluate_kinetic_dataset(path, cal,type):
    """Evaluate all Byonoy CSV files in a directory
    
    Reads a single Byonoy kinetic CSV file, compares the data to 
    calibration values, and prints any errors and pass/fail results.
    
    path: str
        absolute path of the CSV file
    cal: namedtuple
        the reference plate calibration values and tolerances,
        returned from read_byonoy_file_to_array()
    """
    run_data = []
    
    # Use the filename slug to determine if the Hellma plate
    # is rotated or not
    if "_180deg" in path:
        flipped = False
    elif "_0deg" in path:
        flipped = True
    else:
        print("Cannot determine reference plate orientation from filename!!!")
        return 
    
    run_data = read_byonoy_kinetic_to_list(path)
    #print(run_data)
    
    if (len(run_data) > 0):
        run_error_cells = check_byonoy_data_accuracy(run_data, cal, flipped)
        #print(run_error_cells)
        if (len(run_error_cells) > 0):
            for i, error_cells in enumerate(run_error_cells):
                for cell in error_cells:
                    print("FAIL: Cell " + cell + " out of accuracy spec in run " + str(i))
                    if type == 0:
                        dic['450Accuracy'] = "FAIL"
                    else:
                        dic['650Accuracy'] = "FAIL"
        else:
            print("PASS: All cells at this wavelength and orientation meet accuracy specification")
            if type == 0:
                dic['450Accuracy'] = "PASS"
            else:
                dic['650Accuracy'] = "PASS"
                
        error_cells = check_byonoy_data_repeatability(run_data, cal, flipped)
        if (len(error_cells) > 0):
            for cell in error_cells:
                print("FAIL: Cell " + cell + " is out of repeatability spec")
                if type == 0:
                    dic['450Repeatability'] = "FAIL"
                else:
                    dic['650Repeatability'] = "FAIL"
        else:
            print("PASS: All cells at this wavelength and orientation meet repeatability specification")
            if type == 0:
                dic['450Repeatability'] = "PASS"
            else:
                dic['650Repeatability'] = "PASS"
    return


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

def create_data_folder_and_csv():
    # 获取当前日期
    today = datetime.today().strftime('%Y-%m-%d')

    # 创建文件夹路径
    folder_path = os.path.join('.\\', 'PlateReaderQCData')

    # 如果文件夹不存在，则创建文件夹
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)

    # 创建或打开今天的 CSV 文件
    csv_file_path = os.path.join(folder_path, f'{today}QC.csv')
    csv_exists = os.path.exists(csv_file_path)

    with open(csv_file_path, 'a', newline='') as csvfile:
        fieldnames = []
        for name in dic.keys():
            fieldnames.append(name)
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        # 如果 CSV 文件不存在，则写入列名
        if not csv_exists:
            writer.writeheader()

        # 写入数据
        writer.writerow(dic)

if __name__ == "__main__":    
    # Read Hellma plate calibration
    cal_450_file = glob.glob('./' + CALIBRATION_SUBDIR + '/hellma_*_450nm.csv')[0]
    cal_650_file = glob.glob('./' + CALIBRATION_SUBDIR + '/hellma_*_650nm.csv')[0]
    cal_450 = read_byonoy_file_to_array(cal_450_file)
    cal_650 = read_byonoy_file_to_array(cal_650_file)
    dic['DataTime'] = datetime.today().strftime('%Y-%m-%d %H:%M:%S')
    optmaa_pattern = re.compile(r'OPT[A-Z]{3}[0-9]{5}')
    if KINETIC:
        # Read in data path
        #BASE_PATH = './PVTProductionData/OPTMAA00003_002/OPTMAA00003_180deg_01'
        BASE_PATH = input("Enter relative CSV file base path and filename (without wavelength suffix): ")
        CSV_PATH = BASE_PATH + '_450nm.csv'
        if not os.path.isfile(CSV_PATH):
            print("File does not exist!!!")
            sys.exit()
        match = optmaa_pattern.search(BASE_PATH)
        #print(match)
        if match:
            key_characters = match.group()
            #print(key_characters)
            dic['SN'] = key_characters
        else:
            print("未找到产品")
        evaluate_kinetic_dataset(CSV_PATH, cal_450,0)
        
        CSV_PATH = BASE_PATH + '_650nm.csv'
        if not os.path.isfile(CSV_PATH):
            print("File does not exist!!!")
            sys.exit()
        evaluate_kinetic_dataset(CSV_PATH, cal_650,1)
        
        print("Make sure to test both 0deg and 180deg plate orientations!")
    else:
        # Read in data path
        #DATA_DIR = './ByonoyData/BYOMAA00040_20240904_001/'
        DATA_DIR = input("Enter CSV file path: ")
        if not os.path.isdir(DATA_DIR):
            print("Directory does not exist!!!")
            sys.exit()
    
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

    create_data_folder_and_csv()
    