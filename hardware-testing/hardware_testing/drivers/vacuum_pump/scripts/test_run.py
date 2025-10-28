from subprocess import Popen, CREATE_NEW_CONSOLE
import time

if __name__ == "__main__":
    test_script_name = 'vacuum_pump_test'
    Popen(
        ["python", "vacuum_pump_test.py"],
        creationflags=CREATE_NEW_CONSOLE,
        )
    time.sleep(1)
    Popen(
        ["python", "realtime_plot_tool.py"],
        creationflags=CREATE_NEW_CONSOLE,
        )
    input('Enter to exit from Python script...')