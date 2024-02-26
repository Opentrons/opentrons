import csv
import os
import argparse
from typing import List, Optional, Tuple
import matplotlib.pyplot as plot
import numpy as np


def running_avg(
    time: List, pressure: List, z_travel: List, p_travel: List
) -> Optional[Tuple[str, str, str]]:
    pressure_derivative_threshold = 2
    running_avg_threshold = 2

    average = float(pressure[0])
    running_time = []
    running_derivative = []
    running_avg = []
    return_val = None
    for i in range(1, len(time)):
        prev_avg = average
        average = (average + float(pressure[i])) / 2
        running_avg_derivative = average - prev_avg

        running_time.append(time[i])
        running_derivative.append(running_avg_derivative)
        running_avg.append(average)

        # print(running_avg_derivative)

        # there are kinda drastic changes in avg derivative in the very beginning
        if i > 10 and abs(running_avg_derivative) > pressure_derivative_threshold:
        # if average < running_avg_threshold:
            # breakpoint()
            print(f"found z height = {z_travel[i]}")
            print(f"at time = {time[i]}")
            return_val = time[i], z_travel[i], p_travel[i]
    time_array = np.array(running_time)
    derivative_array = np.array(running_derivative)
    avg_array = np.array(running_avg)

    plot.plot(time_array, avg_array)
    plot.show()

    return return_val


def main() -> None:
    """Main function."""

    # data starts at row 63

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--filepath",
        type=str,
        help="path to the input file",
        default=None,
    )
    args = parser.parse_args()

    path = args.filepath + "/"
    for run_file in os.listdir(args.filepath):
        with open(path + run_file, "r") as file:
            reader = csv.reader(file)
            reader_list = list(reader)

        number_of_trials = int((len(reader_list[0]) - 1) / 3)

        # have a time list for each trial so the list lengths can all be equal
        for trial in range(number_of_trials):
            expected_height = reader_list[44 + trial][2]
            print(f"Trial {trial}:")
            print(f"Expected z height: {expected_height}")

            # pressure = reader_list[63:][3 * trial + 1]
            # z_travel = reader_list[63:][3 * trial + 2]
            # p_travel = reader_list[63:][3 * trial + 3]
            time = []
            pressure = []
            z_travel = []
            p_travel = []
            for row in range(63, len(reader_list)):
                current_time = reader_list[row][0]
                current_pressure = reader_list[row][3 * trial + 1]
                current_z_pos = reader_list[row][3 * trial + 2]
                current_p_pos = reader_list[row][3 * trial + 3]

                if any(
                    [
                        data == ""
                        for data in [current_pressure, current_z_pos, current_p_pos]
                    ]
                ):
                    break

                time.append(current_time)
                pressure.append(current_pressure)
                z_travel.append(current_z_pos)
                p_travel.append(current_p_pos)

            threshold_data = running_avg(time, pressure, z_travel, p_travel)
            threshold_time = threshold_data[0]
            threshold_z_pos = threshold_data[1]
            threshold_p_pos = threshold_data[2]
            if threshold_data:
                print(
                    f"Threshold found at:\n\ttime: {threshold_time}\n\tz distance: {threshold_z_pos}\n\tp distance: {threshold_p_pos}"
                )
            else:
                print("No threshold found")
        print()


if __name__ == "__main__":
    main()
