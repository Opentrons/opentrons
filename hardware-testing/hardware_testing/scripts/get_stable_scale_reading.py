"""Shenzhen Scale."""
import datetime
from hardware_testing import data
from typing import List
from hardware_testing.drivers import find_port, list_ports_and_select
from hardware_testing.drivers.radwag import RadwagScale


def _create_scale_reading_file() -> List[str]:
    test_name = "TC_Evaporation"
    run_id = data.create_run_id()
    tag = ""
    file_name = data.create_file_name(test_name, run_id, tag)
    header = ["Date", "Scale Reading", "Stable"]
    header_str = ",".join(header) + "\n"
    data.append_data_to_file(
        test_name=test_name, run_id=run_id, file_name=file_name, data=header_str
    )
    save_file_variables = [test_name, run_id, file_name]
    return save_file_variables


if __name__ == "__main__":
    # find port using known VID:PID, then connect
    vid, pid = RadwagScale.vid_pid()
    try:
        scale = RadwagScale.create(port=find_port(vid=vid, pid=pid))
    except RuntimeError:
        device = list_ports_and_select()
        scale = RadwagScale.create(device)
    scale.connect()
    is_stable = False
    save_file_variables = _create_scale_reading_file()
    results_list = []
    break_all = False
    while is_stable is False:
        grams, is_stable = scale.read_mass()
        print(f"Scale reading: grams={grams}, is_stable={is_stable}")
        time_now = datetime.datetime.now()
        row = [time_now, grams, is_stable]
        results_list.append(row)
        while is_stable is True:
            print(f"Scale stable reading {grams}.")
            result_string = ""
            for sublist in results_list:
                row_str = ", ".join(map(str, sublist)) + "\n"
                result_string += row_str
            file_path = data.append_data_to_file(
                save_file_variables[0],
                save_file_variables[1],
                save_file_variables[2],
                result_string,
            )
            is_stable = False
            y_or_no = input("Do you want to weight another sample? (Y/N): ")
            if y_or_no == "Y":
                is_stable = False
                save_file_variables = _create_scale_reading_file()
            elif y_or_no == "N":
                break_all = True
        if break_all:
            break
