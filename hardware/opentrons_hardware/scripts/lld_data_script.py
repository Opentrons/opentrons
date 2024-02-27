import csv
import os
import argparse
from typing import List, Optional, Tuple
import matplotlib.pyplot as plot
import numpy as np

#----present day threshold based----
def tick_th(pressure: float) -> bool:
    return pressure < -150
def reset_th() -> None:
    pass


#-----Simple moving average derivative---
impossible_pressure_smad = 9001.0
samples_n_smad = 4
running_samples_smad : List[float] = [impossible_pressure_smad] * samples_n_smad
derivative_threshold_smad = -2.5

def reset_smad() -> None:
    global running_samples_smad
    running_samples_smad = [impossible_pressure_smad] * samples_n_smad

def tick_smad(pressure: float) -> bool:
    global running_samples_smad
    try:
        next_ind = running_samples_smad.index(impossible_pressure_smad)
        # if no exception we're still filling the minimum samples
        running_samples_smad[next_ind] = pressure
        return False
    except ValueError: # the array has been filled
        pass
    # store old running average
    prev_running_avg = sum(running_samples_smad)/samples_n_smad
    # left shift old samples
    for i in range(samples_n_smad-1):
        running_samples_smad[i] = running_samples_smad[i+1]
    running_samples_smad[samples_n_smad-1] = pressure
    new_running_avg = sum(running_samples_smad)/samples_n_smad
    return (new_running_avg - prev_running_avg) < derivative_threshold_smad

#-----weighted moving average derivative---
import numpy
impossible_pressure_wmad = 9001.0
samples_n_wmad = 4
weights_wmad = numpy.array([0.5, 0.25, 0.15, 0.1])
running_samples_wmad = numpy.full(samples_n_wmad, impossible_pressure_wmad)
derivative_threshold_wmad = -2

def reset_wmad() -> None:
    global running_samples_wmad
    assert(numpy.sum(weights_wmad) == 1)
    running_samples_wmad = numpy.full(samples_n_wmad, impossible_pressure_wmad)

def tick_wmad(pressure: float) -> bool:
    global running_samples_wmad
    if numpy.isin(impossible_pressure_wmad, running_samples_wmad):
        next_ind = numpy.where(running_samples_wmad==impossible_pressure_wmad)[0][0]
        # if no exception we're still filling the minimum samples
        running_samples_wmad[next_ind] = pressure
        return False
    # store old running average
    prev_running_avg = numpy.sum(numpy.multiply(running_samples_wmad, weights_wmad))
    # left shift old samples
    for i in range(samples_n_wmad-1):
        running_samples_wmad[i] = running_samples_wmad[i+1]
    running_samples_wmad[samples_n_wmad-1] = pressure
    new_running_avg = numpy.sum(numpy.multiply(running_samples_wmad, weights_wmad))
    return (new_running_avg - prev_running_avg) < derivative_threshold_wmad

#-----exponential moving average derivative---
impossible_pressure_emad: float = 9001.0
current_average_emad : float = impossible_pressure_emad
derivative_threshold_emad = -1.5

def reset_emad() -> None:
    global current_average_emad
    current_average_emad = impossible_pressure_emad

def tick_emad(pressure: float) -> bool:
    global current_average_emad
    if current_average_emad == impossible_pressure_emad:
        current_average_emad = pressure
        return False
    else:
        new_average = (pressure + current_average_emad) / 2
        derivative = new_average - current_average_emad
        current_average_emad = new_average
        return derivative < derivative_threshold_emad

def running_avg(
    time: List, pressure: List, z_travel: List, p_travel: List, no_plot: bool, reset_func, tick_func
) -> Optional[Tuple[str, str, str]]:
    reset_func()
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
        if tick_func(float(pressure[i])):
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

    if not no_plot:
        plot.plot(time_array, avg_array)
        plot.show()

    return return_val

def run(args: argparse.Namespace, reset_func, tick_func):

    path = args.filepath + "/"
    for run_file in os.listdir(args.filepath):
        with open(path + run_file, "r") as file:
            reader = csv.reader(file)
            reader_list = list(reader)

        number_of_trials = int(reader_list[34][2])

        expected_height = reader_list[44][6]
        # have a time list for each trial so the list lengths can all be equal
        results: List[float] = []
        for trial in range(number_of_trials):
            #print(f"Trial {trial}:")
            #print(f"Expected z height: {expected_height}")

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

            threshold_data = running_avg(time, pressure, z_travel, p_travel, args.no_plot, reset_func, tick_func)
            threshold_time = threshold_data[0]
            threshold_z_pos = threshold_data[1]
            threshold_p_pos = threshold_data[2]
            if threshold_data:
                #print(
                #    f"Threshold found at:\n\ttime: {threshold_time}\n\tz distance: {threshold_z_pos}\n\tp distance: {threshold_p_pos}"
                #)
                results.append(float(threshold_z_pos))
            else:
                print("No threshold found")
        max_v = max(results)
        min_v = min(results)
        print(f"expected {expected_height}\n min {min_v} max {max_v} average {sum(results)/len(results)}, range {max_v - min_v}")
        print()

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
    parser.add_argument(
        "--no-plot",
        action="store_true"
    )
    args = parser.parse_args()


    function_pairs = [("threshold", reset_th, tick_th), ("simple moving avg der", reset_smad, tick_smad), ("weighted moving avg der", reset_wmad,tick_wmad), ("exponential moving avg der", reset_emad, tick_emad)]
    for name, reset_func, tick_func in function_pairs:
        print(f"Algorythm {name}")
        run(args, reset_func, tick_func)


if __name__ == "__main__":
    main()
