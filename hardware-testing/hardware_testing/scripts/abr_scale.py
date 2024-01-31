"""ABR Scale Reader."""
import os, datetime
from hardware_testing import data
from hardware_testing.drivers import find_port
from hardware_testing.drivers.radwag import RadwagScale
from typing import Dict, List

### VARIABLES ###
# Test Variables
test_type_list = ["E", "P"]
step_list = ["1", "2", "3"]
robot_list = [
    "DVT1ABR1",
    "DVT1ABR2",
    "DVT1ABR3",
    "DVT1ABR4",
    "DVT2ABR5",
    "DVT2ABR6",
    "PVT1ABR7",
    "PVT1ABR8",
    "PVT1ABR9",
    "PVT1ABR10",
    "PVT1ABR11",
    "PVT1ABR12",
]
# Labware per Robot
labware_DVT1ABR4 = [
    "Sample Plate",
    "Reservoir",
    "Reagent Plate",
    "Plate1",
    "Seal1",
    "Plate2",
    "Seal2",
]
labware_PVT1ABR9 = ["Waste", "Reservoir", "PCR Plate", "Deep Well Plate"]
labware_PVT1ABR10 = ["Waste", "R1", "R2", "PCR Plate", "Deep Well Plate"]
labware_PVT1ABR11 = [
    "Waste",
    "Reservoir",
    "Sample Plate",
    "Working Plate",
    "Final Plate",
    "Reagents",
]
labware_DVT1ABR3 = ["Plate1", "Seal1", "Plate2", "Seal2"]
labware_PVT1ABR7 = ["Waste", "R1", "R2", "PCR Plate", "Deep Well Plate"]
labware = [
    labware_DVT1ABR4,
    labware_PVT1ABR9,
    labware_PVT1ABR10,
    labware_PVT1ABR11,
    labware_DVT1ABR3,
    labware_PVT1ABR7,
]
abr = ["DVT1ABR4", "PVT1ABR9", "PVT1ABR10", "PVT1ABR11", "DVT1ABR3", "PVT1ABR7"]
robot_labware: Dict[str, List[str]] = {"Robot": [], "Labware": []}
for i in range(len(labware)):
    robot_labware["Robot"].extend([abr[i]] * len(labware[i]))
    robot_labware["Labware"].extend(labware[i])


def _get_user_input(list: List, some_string:str ) -> str:
    variable = input(some_string)
    while variable not in list:
        print(
            f"Your input was {variable}. Expected input is one of the following: {list}"
        )
        variable = input(some_string)
    return variable


if __name__ == "__main__":
    try:
        # find port using known VID:PID, then connect
        vid, pid = RadwagScale.vid_pid()
        # NOTE: using different scale in ABR than production
        #       and we found the PID is different
        # TODO: maybe make this an argument that can be passed into script :shrug"
        pid = 41207
        scale = RadwagScale.create(port=find_port(vid=vid, pid=pid))
        scale.connect()
        grams, is_stable = scale.read_mass()
        print(f"Scale reading: grams={grams}, is_stable={is_stable}")
        grams, is_stable = scale.read_mass()
        print(f"Scale reading: grams={grams}, is_stable={is_stable}")
        grams, is_stable = scale.read_mass()
        print(f"Scale reading: grams={grams}, is_stable={is_stable}")
        grams, is_stable = scale.read_mass()
        print(f"Scale reading: grams={grams}, is_stable={is_stable}")
        # Get user input to label data entry correctly
        scale_measurement = "ABR-Liquids-"
        robot_to_filter = _get_user_input(robot_list, "Robot: ")
        test_type = _get_user_input(test_type_list, "Test Type (E/P): ")
        test_name = scale_measurement + robot_to_filter + "-" + test_type
        run_id = data.create_run_id()
        filtered_robot_labware = {
            "Robot": [
                robot
                for robot in robot_labware["Robot"]
                if robot.upper() == robot_to_filter.upper()
            ],
            "Labware": [
                labware1
                for i, labware1 in enumerate(robot_labware["Labware"])
                if robot_labware["Robot"][i].upper() == robot_to_filter.upper()
            ],
        }
        labware_list = filtered_robot_labware["Labware"]
        labware_input = _get_user_input(labware_list, f"Labware, Expected Values: {labware_list}: ")
        step = _get_user_input(step_list, "Testing Step (1, 2, 3): ")
        # Set up .csv file
        tag = labware_input + "-" + str(step)
        file_name = data.create_file_name(test_name, run_id, tag)
        header = ["Date", "Labware", "Step", "Robot", "Scale Reading", "Stable"]
        header_str = ",".join(header) + "\n"
        data.append_data_to_file(
            test_name=test_name, run_id=run_id, file_name=file_name, data=header_str
        )
        results_list = []
        while not (is_stable == True):
            grams, is_stable = scale.read_mass()
            print(f"Scale reading: grams={grams}, is_stable={is_stable}")
            time_now = datetime.datetime.now()
            row = [time_now, labware, step, robot_to_filter, grams, is_stable]
            results_list.append(row)
            if is_stable is True:
                print("is stable")
                break
        result_string = ""
        for sublist in results_list:
            row_str = ", ".join(map(str, sublist)) + "\n"
            result_string += row_str
        file_path = data.append_data_to_file(
            test_name, run_id, file_name, result_string
        )
        if os.path.exists(file_path):
            print("File saved")
            with open(file_path, "r") as file:
                line_count = sum(1 for line in file)
                if line_count < 2:
                    print(f"Line count is {line_count}. Check file.")
        else:
            print("File did not save.")
    finally:
        scale.disconnect()
