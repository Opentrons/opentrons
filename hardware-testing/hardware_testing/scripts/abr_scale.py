from ast import Try
import sys, os, time, datetime
import pandas as pd
from serial.tools.list_ports import comports  # type: ignore[import]
sys.path.insert(0, os.path.abspath('../'))
from drivers import RadwagScale

def find_port(vid: int, pid: int) -> str:
    """Find COM port from provided VIP:PID."""
    # print(comports())
    for port in comports():
        print(port.pid)
        print(port.vid)
        if port.pid == pid and port.vid == vid:
            return port.device
    raise RuntimeError(f"Unable to find serial " f"port for VID:PID={vid}:{pid}")

def get_user_input():
    test_type   = input('Test Type (E/P): ')
    if test_type    == 'E':
        subfolder = 'Evaporation Results/'
    elif test_type  == 'P':
        subfolder = 'Protocol Results/'
    else:
        print(f'Your input was: {test_type}. Expected input was {test_type_list}')
        test_type = input('Test Type (E/P): ' )
    robot       = input('Robot: ')
    while robot not in robot_list:
        print(f'Your input was {robot}. Expected input is one of the following: {robot_list}')
        robot = input('Robot: ')
    step        = input('Testing Step (1, 2, 3): ')
    labware_list = df_labware[df_labware['Robot'] == robot]['Labware'].unique()
    labware = input(f'Labware, Expected Values: {labware_list}: ')
    while labware not in labware_list:
        print(f'Your input was {labware}. Expected input is one of the following: {labware_list}')
        labware = input('Labware: ')    
    # Create new folder for todays date
    time_now = datetime.datetime.now() # Reads current Time
    date = str(time_now).split(' ')[0] # Extracts Date
    new_folder_path = os.path.join(current_working_directory, subfolder, date)
    if not os.path.exists(new_folder_path):
        os.makedirs(new_folder_path)
    filename = date + '_' + robot + '_' + step + '_' + labware + '.csv'
    savepath = new_folder_path + '/'+ filename
    return savepath, step, robot
if __name__ == '__main__':
    # Define allowable user inputs
    # Robots
    robot_list = {'DVT1ABR1', 'DVT1ABR2', 'DVT1ABR3', 'DVT1ABR4', 'DVT2ABR5', 'DVT2ABR6', 'PVT1ABR7', 'PVT1ABR8', 'PVT1ABR9', 'PVT1ABR10', 'PVT1ABR11', 'PVT1ABR12'}
    # Test Type
    test_type_list = {'E', 'P'}
    # Test Step
    test_step_list = {1, 2, 3}
    # Labware per Robot
    labware_DVT1ABR4 = ['Sample Plate', 'Reservoir', 'Reagent Plate', 'Plate1', 'Seal1', 'Plate2', 'Seal2']
    labware_PVT1ABR9 = ['Waste', 'Reservoir', 'PCR Plate', 'Deep Well Plate']
    labware_PVT1ABR10 = ['Waste', 'R1', 'R2', 'PCR Plate', 'Deep Well Plate']
    labware_PVT1ABR11 = ['Waste', 'Reservoir', 'Sample Plate', 'Working Plate', 'Final Plate', 'Reagents']
    labware_DVT1ABR3 = ['Plate1', 'Seal1', 'Plate2', 'Seal2']
    labware_PVT1ABR7 = ['PCR Plate']
    labware = [labware_DVT1ABR4, labware_PVT1ABR9, labware_PVT1ABR10, labware_PVT1ABR11, labware_DVT1ABR3, labware_PVT1ABR7]
    abr = ['DVT1ABR4', 'PVT1ABR9', 'PVT1ABR10', 'PVT1ABR11', 'DVT1ABR3', 'PVT1ABR7']
    data = {'Robot': [], 'Labware': []}
    for i in range(len(labware)):
        data['Robot'].extend([abr[i]] * len(labware[i]))
        data['Labware'].extend(labware[i])
    df_labware = pd.DataFrame(data)
    # find port using known VID:PID, then connect
    scale = RadwagScale.create(port=find_port(vid=1155, pid=41207))
    scale.connect()
    # read grams and stability marker
    df = pd.DataFrame()
    # Gets the current working directory
    current_working_directory = os.getcwd()
    
    try:
        grams, is_stable = scale.read_mass()
        # Prompts user with input
        savepath, step, robot = get_user_input()   
        file_check = os.path.isfile(savepath)
        if file_check == True:
            y_or_no = input('This file already exists. Do you want to replace this file? (Y/N)')
            if y_or_no == 'N':
                savepath, step, robot = get_user_input()
            else:
                savepath, step, robot = savepath
        print(file_check)
        grams, is_stable = scale.read_mass()
        print(f'Grams {grams}, Stable: {is_stable}')
        while not(is_stable == 'True') or file_check == False:
            grams, is_stable = scale.read_mass()
            time_now = datetime.datetime.now()
            print(f"Scale reading: grams={grams}, is_stable={is_stable}" )
            df_reading = pd.DataFrame({'Date': time_now,'Testing Step': step, 'Sample': labware, 'Robot': robot, 'Scale Reading': grams, 'Stable': is_stable}, index = [0])
            df = pd.concat([df, df_reading])
            if bool(is_stable) == 1: 
                df.to_csv(savepath)
                break
            # disconnect from serial port
    except Exception:
        scale.disconnect()
    except KeyboardInterrupt:
        scale.disconnect()
    print('success')    
