"""Shenzhen Scale."""
import datetime
from hardware_testing import data
from hardware_testing.drivers import find_port
from hardware_testing.drivers.radwag import RadwagScale

if __name__ == "__main__":
    try:
        # find port using known VID:PID, then connect
        vid, pid = RadwagScale.vid_pid()
        scale = RadwagScale.create(port=find_port(vid=vid, pid=pid))
        scale.connect()
        grams, is_stable = scale.read_mass()
        print(f"Scale reading: grams={grams}, is_stable={is_stable}")
        test_name = "TC_Evaporation"
        run_id = data.create_run_id()
        tag = ""
        file_name = data.create_file_name(test_name, run_id, tag)
        header = ["Date", "Scale Reading", "Stable"]
        header_str = ",".join(header) + "\n"
        data.append_data_to_file(
            test_name=test_name, run_id=run_id, file_name=file_name, data=header_str
        )
        results_list = []
        while is_stable is False:
            grams, is_stable = scale.read_mass()
            print(f"Scale reading: grams={grams}, is_stable={is_stable}")
            time_now = datetime.datetime.now()
            row = [time_now, grams, is_stable]
            results_list.append(row)
            if is_stable is True:
                print(f"Scale stable reading {grams}.")
                break
    finally:
        scale.disconnect()
