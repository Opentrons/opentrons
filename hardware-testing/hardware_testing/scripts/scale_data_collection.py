import sys, os, time, datetime
import pandas as pd
from serial.tools.list_ports import comports  # type: ignore[import]
sys.path.insert(0, os.path.abspath('../'))
from hardware_testing.drivers import RadwagScale

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
    df = pd.DataFrame()
    test = 'x'
    try:
        grams, is_stable = scale.read_mass()
        time_now = datetime.datetime.now()
        print(bool(is_stable))
        robot = input('Robot: ')
        labware = input('Labware: ')
        while not(is_stable == 'True'):       
            grams, is_stable = scale.read_mass()
            time_now = datetime.datetime.now()
            print(f"Scale reading: grams={grams}, is_stable={is_stable}" )
            df_reading = pd.DataFrame({'Date': time_now,'Labware': labware, 'Robot': robot, 'Scale Reading': grams, 'Stable': is_stable}, index = [0])
            df = pd.concat([df, df_reading])
            if bool(is_stable) == 1:
                filename = robot + '_' + labware + '.csv'
                df.to_csv(os.path.expanduser('~/Documents') + filename)
                break
                
            # disconnect from serial port
    except Exception:
        scale.disconnect()
    except KeyboardInterrupt:
        scale.disconnect()
    print('success')


    
