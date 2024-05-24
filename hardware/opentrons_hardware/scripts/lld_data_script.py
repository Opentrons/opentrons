"""Script that can process previous real world data to test lld processes."""
import csv
import os
import argparse
import sys
from typing import List, Optional, Tuple, Any, Dict
import matplotlib.pyplot as plot
import numpy
from abc import ABC, abstractmethod

impossible_pressure = 9001.0
accepted_error = 0.1


class LLDAlgoABC(ABC):
    """An instance of an lld algorithm."""

    @staticmethod
    @abstractmethod
    def name() -> str:
        """Name of this algorithm."""
        ...

    @abstractmethod
    def tick(self, pressures: Tuple[float, float]) -> Tuple[bool, Tuple[float, float]]:
        """Simulate firmware motor interrupt tick."""
        ...

    @abstractmethod
    def reset(self) -> None:
        """Reset simulator between runs."""
        ...


class LLDPresThresh(LLDAlgoABC):
    """present day threshold based."""

    threshold: float

    def __init__(self, thresh: float = -150) -> None:
        """Init."""
        self.threshold = thresh

    @staticmethod
    def name() -> str:
        """Name of this algorithm."""
        return "{:<30}".format("simple threshold")

    def tick(self, pressures: Tuple[float, float]) -> Tuple[bool, Tuple[float, float]]:
        """Simulate firmware motor interrupt tick."""
        return (
            pressures[0] < self.threshold or pressures[1] < self.threshold,
            pressures,
        )

    def reset(self) -> None:
        """Reset simulator between runs."""
        pass


class LLDSMAT(LLDAlgoABC):
    """Simple moving average threshold."""

    samples_n_smat: int
    running_samples_smat_p: List[float]
    running_samples_smat_s: List[float]
    threshold_smat: float

    def __init__(self, samples: int = 10, thresh: float = -15) -> None:
        """Init."""
        self.samples_n_smat = samples
        self.threshold_smat = thresh
        self.reset()

    @staticmethod
    def name() -> str:
        """Name of this algorithm."""
        return "{:<30}".format("simple moving avg thresh")

    def reset(self) -> None:
        """Reset simulator between runs."""
        self.running_samples_smat_p = [impossible_pressure] * self.samples_n_smat
        self.running_samples_smat_s = [impossible_pressure] * self.samples_n_smat

    @staticmethod
    def _tick_one_sensor(
        pressure: float, samples_n: int, running_samples: List[float]
    ) -> Tuple[float, List[float]]:
        """ticks one sensor returns the new current average and running_samples."""
        try:
            next_ind = running_samples.index(impossible_pressure)
            # if no exception we're still filling the minimum samples
            running_samples[next_ind] = pressure
            return (impossible_pressure, running_samples)
        except ValueError:  # the array has been filled
            pass
        # left shift old samples
        for i in range(samples_n - 1):
            running_samples[i] = running_samples[i + 1]
        running_samples[samples_n - 1] = pressure
        new_running_avg = sum(running_samples) / samples_n
        return (new_running_avg, running_samples)

    def tick(self, pressures: Tuple[float, float]) -> Tuple[bool, Tuple[float, float]]:
        """Simulate firmware motor interrupt tick."""
        new_avg_p, self.running_samples_smad_p = LLDSMAT._tick_one_sensor(
            pressures[0], self.samples_n_smat, self.running_samples_smat_p
        )
        new_avg_s, self.running_samples_smad_s = LLDSMAT._tick_one_sensor(
            pressures[1], self.samples_n_smat, self.running_samples_smat_s
        )
        return (
            abs(new_avg_p) > self.threshold_smat
            or abs(new_avg_s) > self.threshold_smat,
            (new_avg_p, new_avg_s),
        )


class LLDSMAD(LLDAlgoABC):
    """Simple moving average derivative."""

    samples_n_smad: int
    running_samples_smad_p: List[float]
    running_samples_smad_s: List[float]
    derivative_threshold_smad: float

    def __init__(self, samples: int = 10, thresh: float = -2.5) -> None:
        """Init."""
        self.samples_n_smad = samples
        self.derivative_threshold_smad = thresh
        self.reset()

    @staticmethod
    def name() -> str:
        """Name of this algorithm."""
        return "{:<30}".format("simple moving avg der")

    def reset(self) -> None:
        """Reset simulator between runs."""
        self.running_samples_smad_p = [impossible_pressure] * self.samples_n_smad
        self.running_samples_smad_s = [impossible_pressure] * self.samples_n_smad

    @staticmethod
    def _tick_one_sensor(
        pressure: float, samples_n: int, running_samples: List[float]
    ) -> Tuple[float, float, List[float]]:
        """ticks one sensor returns the new current average, new derivative and updated running samples."""
        try:
            next_ind = running_samples.index(impossible_pressure)
            # if no exception we're still filling the minimum samples
            running_samples[next_ind] = pressure
            return (impossible_pressure, 0.0, running_samples)
        except ValueError:  # the array has been filled
            pass
        # store old running average
        prev_running_avg = sum(running_samples) / samples_n
        # left shift old samples
        for i in range(samples_n - 1):
            running_samples[i] = running_samples[i + 1]
        running_samples[samples_n - 1] = pressure
        new_running_avg = sum(running_samples) / samples_n
        return (new_running_avg, new_running_avg - prev_running_avg, running_samples)

    def tick(self, pressures: Tuple[float, float]) -> Tuple[bool, Tuple[float, float]]:
        """Simulate firmware motor interrupt tick."""
        new_avg_p, der_p, self.running_samples_smad_p = LLDSMAD._tick_one_sensor(
            pressures[0], self.samples_n_smad, self.running_samples_smad_p
        )
        new_avg_s, der_s, self.running_samples_smad_s = LLDSMAD._tick_one_sensor(
            pressures[1], self.samples_n_smad, self.running_samples_smad_s
        )
        return (
            abs(der_p) > self.derivative_threshold_smad
            or abs(der_s) > self.derivative_threshold_smad,
            (new_avg_p, new_avg_s),
        )


class LLDWMAD(LLDAlgoABC):
    """Weighted moving average derivative."""

    samples_n_wmad: int
    weights_wmad: numpy.ndarray[Any, numpy.dtype[numpy.float32]] = numpy.array(
        [0.19, 0.17, 0.15, 0.13, 0.11, 0.09, 0.07, 0.05, 0.03, 0.01]
    )
    running_samples_wmad_p: numpy.ndarray[Any, numpy.dtype[numpy.float32]]
    running_samples_wmad_s: numpy.ndarray[Any, numpy.dtype[numpy.float32]]
    derivative_threshold_wmad: float

    def __init__(self, samples: int = 10, thresh: float = -4) -> None:
        """Init."""
        self.samples_n_wmad = samples
        self.derivative_threshold_wmad = abs(thresh)
        self.reset()

    @staticmethod
    def name() -> str:
        """Name of this algorithm."""
        return "{:<30}".format("weighted moving avg der")

    def reset(self) -> None:
        """Reset simulator between runs."""
        assert numpy.sum(self.weights_wmad) == 1
        self.running_samples_wmad_p = numpy.full(
            self.samples_n_wmad, impossible_pressure
        )
        self.running_samples_wmad_s = numpy.full(
            self.samples_n_wmad, impossible_pressure
        )

    @staticmethod
    def _tick_one_sensor(
        pressure: float,
        samples_n: int,
        running_samples: numpy.ndarray[Any, numpy.dtype[numpy.float32]],
        weights_wmad: numpy.ndarray[Any, numpy.dtype[numpy.float32]],
    ) -> Tuple[float, float, numpy.ndarray[Any, numpy.dtype[numpy.float32]]]:
        """ticks one sensor returns the new current average, new derivative and updated running samples."""
        if numpy.isin(impossible_pressure, running_samples):
            next_ind = numpy.where(running_samples == impossible_pressure)[0][0]
            # if no exception we're still filling the minimum samples
            running_samples[next_ind] = pressure
            return (impossible_pressure, 0.0, running_samples)
        # store old running average
        prev_running_avg = numpy.sum(numpy.multiply(running_samples, weights_wmad))
        # left shift old samples
        for i in range(samples_n - 1):
            running_samples[i] = running_samples[i + 1]
        running_samples[samples_n - 1] = pressure
        new_running_avg = numpy.sum(numpy.multiply(running_samples, weights_wmad))
        return (new_running_avg, (new_running_avg - prev_running_avg), running_samples)

    def tick(self, pressures: Tuple[float, float]) -> Tuple[bool, Tuple[float, float]]:
        """Simulate firmware motor interrupt tick."""
        new_avg_p, der_p, self.running_samples_wmad_p = LLDWMAD._tick_one_sensor(
            pressures[0],
            self.samples_n_wmad,
            self.running_samples_wmad_p,
            self.weights_wmad,
        )
        new_avg_s, der_s, self.running_samples_wmad_s = LLDWMAD._tick_one_sensor(
            pressures[1],
            self.samples_n_wmad,
            self.running_samples_wmad_s,
            self.weights_wmad,
        )
        return (
            abs(der_p) > self.derivative_threshold_wmad
            or abs(der_s) > self.derivative_threshold_wmad,
            (new_avg_p, new_avg_s),
        )


class LLDEMAD(LLDAlgoABC):
    """Exponential moving average derivative."""

    current_average_emad_p: float = impossible_pressure
    current_average_emad_s: float = impossible_pressure
    smoothing_factor: float
    derivative_threshold_emad: float

    def __init__(self, s_factor: float = 0.1, thresh: float = -2.5) -> None:
        """Init."""
        self.smoothing_factor = s_factor
        self.derivative_threshold_emad = abs(thresh)
        self.reset()

    @staticmethod
    def name() -> str:
        """Name of this algorithm."""
        return "{:<30}".format("exponential moving avg der")

    def reset(self) -> None:
        """Reset simulator between runs."""
        self.current_average_emad_p = impossible_pressure
        self.current_average_emad_s = impossible_pressure

    @staticmethod
    def _tick_one_sensor(
        pressure: float, current_average: float, smoothing_factor: float
    ) -> Tuple[float, float]:
        """ticks one sensor returns the new current average, new derivative and updated running samples."""
        if current_average == impossible_pressure:
            return (pressure, 0.0)
        else:
            new_average = (pressure * smoothing_factor) + (
                current_average * (1 - smoothing_factor)
            )
            derivative = new_average - current_average
            return (new_average, derivative)

    def tick(self, pressures: Tuple[float, float]) -> Tuple[bool, Tuple[float, float]]:
        """Simulate firmware motor interrupt tick."""
        prev_avg_p = self.current_average_emad_p
        prev_avg_s = self.current_average_emad_s
        self.current_average_emad_p, der_p = LLDEMAD._tick_one_sensor(
            pressures[0], self.current_average_emad_p, self.smoothing_factor
        )
        self.current_average_emad_s, der_s = LLDEMAD._tick_one_sensor(
            pressures[1], self.current_average_emad_s, self.smoothing_factor
        )
        if prev_avg_p is impossible_pressure or prev_avg_s is impossible_pressure:
            ret_avg = (impossible_pressure, impossible_pressure)
        else:
            ret_avg = (self.current_average_emad_p, self.current_average_emad_s)
        return (
            abs(der_p) > self.derivative_threshold_emad
            or abs(der_s) > self.derivative_threshold_emad,
            ret_avg,
        )


def _running_avg(
    time: List[float],
    pressures: List[Tuple[float, float]],
    z_travel: List[float],
    p_travel: List[float],
    no_plot: bool,
    algorithm: LLDAlgoABC,
    plot_name: str,
) -> Optional[Tuple[float, float, float]]:
    algorithm.reset()
    average: Tuple[float, float] = (float(0), float(0))
    running_time = []
    running_derivative_p = []
    running_derivative_s = []
    running_avg_p = []
    running_avg_s = []
    return_val = None
    for i in range(1, len(time)):
        prev_avg = average
        found, average = algorithm.tick(
            (float(pressures[i][0]), float(pressures[i][1]))
        )
        if found:
            # if average < running_avg_threshold:
            # print(f"found z height = {z_travel[i]}")
            # print(f"at time = {time[i]}")
            return_val = time[i], z_travel[i], p_travel[i]
            if no_plot:
                # once we find it we don't need to keep going
                break
        if (impossible_pressure not in average) and (
            impossible_pressure not in prev_avg
        ):
            running_avg_derivative_p = average[0] - prev_avg[0]
            running_avg_derivative_s = average[1] - prev_avg[1]
            running_time.append(time[i])
            running_derivative_p.append(running_avg_derivative_p)
            running_derivative_s.append(running_avg_derivative_s)
            running_avg_p.append(average[0])
            running_avg_s.append(average[1])

    time_array: numpy.ndarray[Any, numpy.dtype[numpy.float32]] = numpy.array(
        running_time
    )
    derivative_array_p: numpy.ndarray[Any, numpy.dtype[numpy.float32]] = numpy.array(
        running_derivative_p
    )
    avg_array_p: numpy.ndarray[Any, numpy.dtype[numpy.float32]] = numpy.array(
        running_avg_p
    )

    derivative_array_s: numpy.ndarray[Any, numpy.dtype[numpy.float32]] = numpy.array(
        running_derivative_s
    )
    avg_array_s: numpy.ndarray[Any, numpy.dtype[numpy.float32]] = numpy.array(
        running_avg_s
    )

    if not no_plot:
        plot.figure(plot_name)
        avg_ax = plot.subplot(211)
        avg_ax.set_title("Running Average")
        plot.plot(time_array, avg_array_p)
        plot.plot(time_array, avg_array_s)
        der_ax = plot.subplot(212)
        der_ax.set_title("Derivative")
        plot.plot(time_array, derivative_array_p)
        plot.plot(time_array, derivative_array_s)
        mng = plot.get_current_fig_manager()
        if mng is not None:
            mng.resize(*mng.window.maxsize())  # type: ignore[attr-defined]
        plot.show()

    return return_val


def run(
    args: argparse.Namespace,
    algorithm: LLDAlgoABC,
) -> List[Tuple[float, List[float], str, str]]:
    """Run the test with a given algorithm on all the data."""
    path = args.filepath + "/"
    report_files = [
        file for file in os.listdir(args.filepath) if "final_report" in file
    ]
    final_results: List[Tuple[float, List[float], str, str]] = []
    for report_file in report_files:
        with open(path + report_file, "r") as file:
            reader = csv.reader(file)
            reader_list = list(reader)

        number_of_trials = int(reader_list[33][2])

        expected_height = reader_list[44][6]
        # have a time list for each trial so the list lengths can all be equal
        results: List[float] = []
        for trial in range(number_of_trials):

            time = []
            pressures = []
            z_travel = []
            p_travel = []
            for row in range((59 + number_of_trials), len(reader_list)):
                current_time = reader_list[row][0]
                current_pressure_s0 = reader_list[row][4 * trial + 2]
                current_pressure_s1 = reader_list[row][4 * trial + 3]
                current_z_pos = reader_list[row][4 * trial + 4]
                current_p_pos = reader_list[row][4 * trial + 5]

                if any(
                    [
                        data == ""
                        for data in [
                            current_pressure_s0,
                            current_pressure_s1,
                            current_z_pos,
                            current_p_pos,
                        ]
                    ]
                ):
                    break

                time.append(float(current_time))
                pressures.append(
                    (float(current_pressure_s0), float(current_pressure_s1))
                )
                z_travel.append(float(current_z_pos))
                p_travel.append(float(current_p_pos))

            threshold_data = _running_avg(
                time,
                pressures,
                z_travel,
                p_travel,
                args.no_plot,
                algorithm,
                f"{algorithm.name()} trial: {trial+1}",
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
        print(
            f"{algorithm.name()}, expected {expected_height} max {max(results)} min{min(results)}, avg {sum(results)/len(results)}"
        )
        final_results.append(
            (float(expected_height), results, f"{algorithm.name()}", f"{report_file}")
        )
    return final_results


def _check_for_failure(expected_height: float, results: List[float]) -> bool:
    for result in results:
        if abs(expected_height - result) > accepted_error:
            return True
    return False


def _score(
    algorithms: List[LLDAlgoABC], analysis: List[Tuple[float, List[float], str, str]]
) -> Dict[str, int]:
    algorithm_score: Dict[str, int] = {algo.name(): 0 for algo in algorithms}
    a_score = len(analysis)
    for a in analysis:
        algorithm_score[a[2]] += a_score
        a_score -= 2
    return dict(sorted(algorithm_score.items(), key=lambda item: item[1], reverse=True))


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

    algorithms: List[LLDAlgoABC] = [
        LLDPresThresh(),
        LLDSMAD(),
        LLDWMAD(),
        LLDEMAD(),
        LLDSMAT(),
    ]
    analysis: List[Tuple[float, List[float], str, str]] = []
    for algorithm in algorithms:
        algorithm_results = run(args, algorithm)
        analysis.extend(algorithm_results)
    print("\n\n")
    for result in analysis:
        res_string = (
            "FAILURE" if _check_for_failure(result[0], result[1]) else "success"
        )
        print(f"Algorithm {result[2]} {res_string}")

    accuracy = sorted(
        analysis, key=lambda acc: abs((sum(acc[1]) / len(acc[1])) - acc[0])
    )
    precision = sorted(analysis, key=lambda per: (max(per[1]) - min(per[1])))

    accuracy_score: Dict[str, int] = _score(algorithms, accuracy)
    precision_score: Dict[str, int] = _score(algorithms, precision)
    algorithm_score: Dict[str, int] = {algo.name(): 0 for algo in algorithms}

    print("Accuracy Scores")
    for a_name in accuracy_score.keys():
        print(f"{a_name} {accuracy_score[a_name]}")

    print("Precision Scores")
    for a_name in precision_score.keys():
        print(f"{a_name} {precision_score[a_name]}")
        # add the two scores together for final score so we can sort before printing
        algorithm_score[a_name] = precision_score[a_name] + accuracy_score[a_name]

    algorithm_score = dict(
        sorted(algorithm_score.items(), key=lambda item: item[1], reverse=True)
    )
    print("Total Scores")
    for a_name in algorithm_score.keys():
        print(f"{a_name} {algorithm_score[a_name]}")


if __name__ == "__main__":
    main()
