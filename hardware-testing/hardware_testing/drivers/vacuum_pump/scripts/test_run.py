from subprocess import Popen, CREATE_NEW_CONSOLE
import time
from datetime import datetime

if __name__ == "__main__":

    test_script_name = 'vacuum_pump_test.py'
    rt_plot_name = 'realtime_plot_tool.py'
    file_name =f'vacuum_test_{datetime.now().strftime("%m-%d-%y_%H-%M")}.csv'
    Popen(
        ["python", test_script_name, "--file_name", file_name],
        creationflags=CREATE_NEW_CONSOLE,
        )
    time.sleep(1)
    Popen(
        ["python", rt_plot_name, "--file_name", file_name],
        creationflags=CREATE_NEW_CONSOLE,
        )
    input('Enter to exit from Python script...')