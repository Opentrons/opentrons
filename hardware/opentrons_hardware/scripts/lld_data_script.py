"""Script that can process previous real world data to test lld processes."""
import csv
import os
import argparse
from typing import List, Optional, Tuple, Any, Callable
import matplotlib.pyplot as plot
import numpy


impossible_pressure = 9001.0


# ----present day threshold based----
def tick_th(pressure: float) -> Tuple[bool, float]:
    """Simulate firmware motor interrupt tick."""
    return (pressure < -150, pressure)


def reset_th() -> None:
    """Reset simulator between runs."""
    pass


# -----Simple moving average derivative---
samples_n_smad = 10
running_samples_smad: List[float] = [impossible_pressure] * samples_n_smad
derivative_threshold_smad = -2.5


def reset_smad() -> None:
    """Reset simulator between runs."""
    global running_samples_smad
    running_samples_smad = [impossible_pressure] * samples_n_smad


def tick_smad(pressure: float) -> Tuple[bool, float]:
    """Simulate firmware motor interrupt tick."""
    global running_samples_smad
    try:
        next_ind = running_samples_smad.index(impossible_pressure)
        # if no exception we're still filling the minimum samples
        running_samples_smad[next_ind] = pressure
        return (False, impossible_pressure)
    except ValueError:  # the array has been filled
        pass
    # store old running average
    prev_running_avg = sum(running_samples_smad) / samples_n_smad
    # left shift old samples
    for i in range(samples_n_smad - 1):
        running_samples_smad[i] = running_samples_smad[i + 1]
    running_samples_smad[samples_n_smad - 1] = pressure
    new_running_avg = sum(running_samples_smad) / samples_n_smad
    return (
        (new_running_avg - prev_running_avg) < derivative_threshold_smad,
        new_running_avg,
    )


# -----weighted moving average derivative---
samples_n_wmad = 10
weights_wmad: numpy.ndarray[Any, numpy.dtype[numpy.float32]] = numpy.array(
    [0.19, 0.17, 0.15, 0.13, 0.11, 0.09, 0.07, 0.05, 0.03, 0.01]
)
running_samples_wmad = numpy.full(samples_n_wmad, impossible_pressure)
derivative_threshold_wmad = -2


def reset_wmad() -> None:
    """Reset simulator between runs."""
    global running_samples_wmad
    assert numpy.sum(weights_wmad) == 1
    running_samples_wmad = numpy.full(samples_n_wmad, impossible_pressure)


def tick_wmad(pressure: float) -> Tuple[bool, float]:
    """Simulate firmware motor interrupt tick."""
    global running_samples_wmad
    if numpy.isin(impossible_pressure, running_samples_wmad):
        next_ind = numpy.where(running_samples_wmad == impossible_pressure)[0][0]
        # if no exception we're still filling the minimum samples
        running_samples_wmad[next_ind] = pressure
        return (False, impossible_pressure)
    # store old running average
    prev_running_avg = numpy.sum(numpy.multiply(running_samples_wmad, weights_wmad))
    # left shift old samples
    for i in range(samples_n_wmad - 1):
        running_samples_wmad[i] = running_samples_wmad[i + 1]
    running_samples_wmad[samples_n_wmad - 1] = pressure
    new_running_avg = numpy.sum(numpy.multiply(running_samples_wmad, weights_wmad))
    return (
        (new_running_avg - prev_running_avg) < derivative_threshold_wmad,
        new_running_avg,
    )


# -----exponential moving average derivative---
current_average_emad: float = impossible_pressure
smoothing_factor = 0.1
derivative_threshold_emad = -2.5


def reset_emad() -> None:
    """Reset simulator between runs."""
    global current_average_emad
    current_average_emad = impossible_pressure


def tick_emad(pressure: float) -> Tuple[bool, float]:
    """Simulate firmware motor interrupt tick."""
    global current_average_emad
    if current_average_emad == impossible_pressure:
        current_average_emad = pressure
        return (False, impossible_pressure)
    else:
        new_average = (pressure * smoothing_factor) + (
            current_average_emad * (1 - smoothing_factor)
        )
        derivative = new_average - current_average_emad
        current_average_emad = new_average
        return (derivative < derivative_threshold_emad, current_average_emad)


def _running_avg(
    time: List[float],
    pressure: List[float],
    z_travel: List[float],
    p_travel: List[float],
    no_plot: bool,
    reset_func: Callable[[], None],
    tick_func: Callable[[float], Tuple[bool, float]],
    plot_name: str,
) -> Optional[Tuple[float, float, float]]:
    reset_func()
    average = float(0)
    running_time = []
    running_derivative = []
    running_avg = []
    return_val = None
    for i in range(1, len(time)):
        prev_avg = average
        found, average = tick_func(float(pressure[i]))
        if found:
            # if average < running_avg_threshold:
            # print(f"found z height = {z_travel[i]}")
            # print(f"at time = {time[i]}")
            return_val = time[i], z_travel[i], p_travel[i]
            if no_plot:
                # once we find it we don't need to keep going
                break
        if average != impossible_pressure and prev_avg != impossible_pressure:
            running_avg_derivative = average - prev_avg
            running_time.append(time[i])
            running_derivative.append(running_avg_derivative)
            running_avg.append(average)

    time_array: numpy.ndarray[Any, numpy.dtype[numpy.float32]] = numpy.array(
        running_time
    )
    derivative_array: numpy.ndarray[Any, numpy.dtype[numpy.float32]] = numpy.array(
        running_derivative
    )
    avg_array: numpy.ndarray[Any, numpy.dtype[numpy.float32]] = numpy.array(running_avg)

    if not no_plot:
        plot.figure(plot_name)
        avg_ax = plot.subplot(211)
        avg_ax.set_title("Running Average")
        plot.plot(time_array, avg_array)
        der_ax = plot.subplot(212)
        der_ax.set_title("Derivative")
        plot.plot(time_array, derivative_array)
        mng = plot.get_current_fig_manager()
        if mng is not None:
            mng.resize(*mng.window.maxsize())  # type: ignore[attr-defined]
        plot.show()

    return return_val


def run(
    args: argparse.Namespace,
    reset_func: Callable[[], None],
    tick_func: Callable[[float], Tuple[bool, float]],
    name: str,
) -> None:
    """Run the test with a given algorithm on all the data."""
    path = args.filepath + "/"
    report_files = [
        file for file in os.listdir(args.filepath) if file == "final_report.csv"
    ]
    for report_file in report_files:
        with open(path + report_file, "r") as file:
            reader = csv.reader(file)
            reader_list = list(reader)

        number_of_trials = int(reader_list[34][2])

        expected_height = reader_list[44][6]
        # have a time list for each trial so the list lengths can all be equal
        results: List[float] = []
        for trial in range(number_of_trials):

            time = []
            pressure = []
            z_travel = []
            p_travel = []
            for row in range((59 + number_of_trials), len(reader_list)):
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

                time.append(float(current_time))
                pressure.append(float(current_pressure))
                z_travel.append(float(current_z_pos))
                p_travel.append(float(current_p_pos))

            threshold_data = _running_avg(
                time,
                pressure,
                z_travel,
                p_travel,
                args.no_plot,
                reset_func,
                tick_func,
                f"{name} trial: {trial+1}",
            )
            if threshold_data:
                # threshold_time = threshold_data[0]
                threshold_z_pos = threshold_data[1]
                # threshold_p_pos = threshold_data[2]
                # print(
                #    f"Threshold found at:\n\ttime: {threshold_time}\n\tz distance: {threshold_z_pos}\n\tp distance: {threshold_p_pos}"
                # )
                results.append(float(threshold_z_pos))
            else:
                print("No threshold found")
        max_v = max(results)
        min_v = min(results)
        print(
            f"expected {expected_height}\n min {min_v} max {max_v} average {sum(results)/len(results)}, range {max_v - min_v}"
        )
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
    parser.add_argument("--no-plot", action="store_true")
    args = parser.parse_args()

    function_pairs = [
        ("threshold", reset_th, tick_th),
        ("simple moving avg der", reset_smad, tick_smad),
        ("weighted moving avg der", reset_wmad, tick_wmad),
        ("exponential moving avg der", reset_emad, tick_emad),
    ]
    for name, reset_func, tick_func in function_pairs:
        print(f"Algorithm {name}")
        run(args, reset_func, tick_func, name)


if __name__ == "__main__":
    main()
