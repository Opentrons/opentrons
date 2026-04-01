"""Compare run logs."""
import json
import argparse
from datetime import datetime
from statistics import mean


def read_commands(path: str) -> list[dict[str, str]] | None:
    """Read json file into a dictionary."""
    try:
        with open(path, "r") as file:
            data = json.load(file)
            return data["commands"]["data"]
    except FileNotFoundError:
        print(f"Error: {path} not found.")
        return None
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON format in {path}")
        return None


def avg_determine_command_time(
    commands: list[dict[str, str]], desired_command: str
) -> None:
    """Extract command of interest."""
    all_durations = []
    for command in commands:
        if command["commandType"] == desired_command:
            start_time = datetime.strptime(
                command.get("startedAt", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
            )
            end_time = datetime.strptime(
                command.get("completedAt", ""), "%Y-%m-%dT%H:%M:%S.%f%z"
            )
            duration = (end_time - start_time).total_seconds()
            all_durations.append(duration)
    avg_duration = mean(all_durations)
    num_of_times = len(all_durations)
    total_time = sum(all_durations)
    print(
        f"""Total Occurences: {num_of_times}
        Average Duration (sec): {avg_duration}
        Total Time (sec): {total_time}"""
    )


if __name__ == "__main__":
    """Compare duration of command in two run logs."""
    parser = argparse.ArgumentParser(description="Compare duration of command")
    parser.add_argument("run_log_1", metavar="RUN_LOG_1", type=str, nargs=1)
    parser.add_argument("run_log_2", metavar="RUN_LOG_2", type=str, nargs=1)
    parser.add_argument("command_string", metavar="COMMAND_STRING", nargs=1)

    args = parser.parse_args()
    run_log_1 = args.run_log_1[0]
    run_log_2 = args.run_log_2[0]
    command_string = args.command_string[0]
    print(f"----REVIEWING COMMAND {command_string}----")
    print(f"Reviewing {run_log_1.split('/')[-1]}")
    commands_1 = read_commands(run_log_1)
    if commands_1:
        avg_determine_command_time(commands_1, command_string)
    print(f"Reviewing {run_log_2.split('/')[-1]}")
    commands_2 = read_commands(run_log_2)
    if commands_2:
        avg_determine_command_time(commands_2, command_string)
