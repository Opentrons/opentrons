import csv
import os
import argparse
from typing import List, Optional, Tuple
import matplotlib.pyplot as plot
import numpy as np


#----present day threshold based----
def tick(pressure: float) -> bool:
    return pressure < -150
def reset() -> None:
    pass


"""
#-----Simple moving average derivative---
impossible_pressure = 9001.0
samples_n = 3
running_samples : List[float] = [impossible_pressure] * samples_n
derivative_threshold = -1

def reset() -> None:
    running_samples = [impossible_pressure] * samples_n

def tick(pressure: float) -> bool:
    try:
        next_ind = running_samples.index(impossible_pressure)
        # if no exception we're still filling the minimum samples
        running_samples[next_ind] = pressure
        return False
    except ValueError: # the array has been filled
        pass
    # store old running average
    prev_running_avg = sum(running_samples)/samples_n
    # left shift old samples
    for i in range(samples_n-1):
        running_samples[i] = running_samples[i+1]
    running_samples[samples_n-1] = pressure
    new_running_avg = sum(running_samples)/samples_n
    return (new_running_avg - prev_running_avg) < derivative_threshold
"""

"""
#-----weighted moving average derivative---
import numpy
impossible_pressure = 9001.0
samples_n = 4
weights = numpy.array([0.4, 0.3, 0.2, 0.1])
running_samples = numpy.full(samples_n, impossible_pressure)
derivative_threshold = -1

def reset() -> None:
    global running_samples
    running_samples = numpy.full(samples_n, impossible_pressure)

def tick(pressure: float) -> bool:
    global running_samples
    if numpy.isin(impossible_pressure, running_samples):
        next_ind = numpy.where(running_samples==impossible_pressure)[0][0]
        # if no exception we're still filling the minimum samples
        running_samples[next_ind] = pressure
        return False
    # store old running average
    prev_running_avg = numpy.sum(numpy.multiply(running_samples, weights))
    # left shift old samples
    for i in range(samples_n-1):
        running_samples[i] = running_samples[i+1]
    running_samples[samples_n-1] = pressure
    new_running_avg = numpy.sum(numpy.multiply(running_samples, weights))
    return (new_running_avg - prev_running_avg) < derivative_threshold
"""

"""
#-----exponential moving average derivative---
impossible_pressure: float = 9001.0
current_average : float = impossible_pressure
derivative_threshold = -1

def reset() -> None:
    global current_average
    current_average = impossible_pressure

def tick(pressure: float) -> bool:
    global current_average
    if current_average == impossible_pressure:
        current_average = pressure
        return False
    else:
        new_average = (pressure + current_average) / 2
        derivative = new_average - current_average
        print(derivative)
        current_average = new_average
        return derivative < derivative_threshold
"""

def running_avg(
    time: List, pressure: List, z_travel: List, p_travel: List
) -> Optional[Tuple[str, str, str]]:
    reset()
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
        if tick(float(pressure[i])):
        # if average < running_avg_threshold:
            # breakpoint()
            #print(f"found z height = {z_travel[i]}")
            #print(f"at time = {time[i]}")
            return_val = time[i], z_travel[i], p_travel[i]
            # once we find it we don't need to keep going
            break
    time_array = np.array(running_time)
    derivative_array = np.array(running_derivative)
    avg_array = np.array(running_avg)

    plot.plot(time_array, avg_array)
    plot.show()

    return return_val


def main() -> None:
    """Main function."""

    # data starts at row 59 + number of trials

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

        number_of_trials = int(reader_list[34][2])

        expected_height = reader_list[44][6]
        # have a time list for each trial so the list lengths can all be equal
        for trial in range(number_of_trials):
            print(f"Trial {trial}:")
            print(f"Expected z height: {expected_height}")

            # pressure = reader_list[63:][3 * trial + 1]
            # z_travel = reader_list[63:][3 * trial + 2]
            # p_travel = reader_list[63:][3 * trial + 3]
            time = []
            pressure = []
            z_travel = []
            p_travel = []
            for row in range((59+number_of_trials), len(reader_list)):
                current_time = reader_list[row][0]
                current_pressure = reader_list[row][3 * trial + 2]
                current_z_pos = reader_list[row][3 * trial + 3]
                current_p_pos = reader_list[row][3 * trial + 4]

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
