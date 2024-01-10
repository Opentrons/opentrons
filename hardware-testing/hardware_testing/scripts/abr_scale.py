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


if __name__ == '__main__':

    # find port using known VID:PID, then connect
    scale = RadwagScale.create(port=find_port(vid=1155, pid=41207))
    scale.connect()
    # read grams and stability marker
    folder = '09JAN24/'
    df = pd.DataFrame()
    test = 'x'
    # get the current working directory
    current_working_directory = os.getcwd()
    try:
        grams, is_stable = scale.read_mass()
        time_now = datetime.datetime.now()
        print(bool(is_stable))
        date = str(time_now).split(' ')[0]
        test_type   = input('Test Type (E/P): ')
        if test_type == 'E':
            subfolder = 'Evaporation Results/'
        elif test_type == 'P':
            subfolder = 'Protocol Results/'
        else:
            print('Your input was: ' + test_type)
            print('Expected input is E or P')
        robot       = input('Robot: ')
        step        = input('Testing Step: ')              
        labware     = input('Labware: ')
        
        while not(is_stable == 'True'):
            
            grams, is_stable = scale.read_mass()
            time_now = datetime.datetime.now()
            print(f"Scale reading: grams={grams}, is_stable={is_stable}" )
            df_reading = pd.DataFrame({'Date': time_now,'Testing Step': step, 'Sample': labware, 'Robot': robot, 'Scale Reading': grams, 'Stable': is_stable}, index = [0])
            df = pd.concat([df, df_reading])
            if bool(is_stable) == 1:
                filename = date + '_' + robot + '_' + step + '_' + labware + '.csv'
                savepath = current_working_directory + '/' + subfolder + filename 
                df.to_csv(savepath)
                break
            # disconnect from serial port
    except Exception:
        scale.disconnect()
    except KeyboardInterrupt:
        scale.disconnect()
    print('success')


    
