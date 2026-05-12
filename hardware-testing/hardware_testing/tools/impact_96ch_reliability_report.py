"""Build CSV reports from 96ch impact protection reliability run logs."""

import argparse
import csv
import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional


COMMAND_START_RE = re.compile(r"cycle=(\d+) command=([^\s]+) start")
COMMAND_RESPONSE_RE = re.compile(r"cycle=(\d+) command=([^\s]+) response=(.*)")
CYCLE_BEGIN_RE = re.compile(r"cycle=(\d+)/(\d+) begin")
CYCLE_COMPLETE_RE = re.compile(r"cycle=(\d+)/(\d+) complete")
RETRY_RE = re.compile(r"Retrying 96ch impact command ([^\s]+) on port ([^:]+): (.*)")
REOPEN_RE = re.compile(r"Failed to reopen Impact 96ch serial port ([^;]+);")
PORT_RE = re.compile(r"p (/dev/\S+) - (.*)")
FINAL_FAILED_COMMAND_RE = re.compile(r"after command ([^\s]+) on port ([^:]+):")


def _iter_messages(run_log: Dict[str, Any]) -> Iterable[Dict[str, Any]]:
    for command in run_log.get("commands", {}).get("data", []):
        params = command.get("params", {})
        message = params.get("message")
        if isinstance(message, str):
            yield {
                "created_at": command.get("createdAt", ""),
                "started_at": command.get("startedAt", ""),
                "completed_at": command.get("completedAt", ""),
                "message": message,
            }


def _first_error_detail(run_log: Dict[str, Any]) -> str:
    errors = run_log.get("data", {}).get("errors", [])
    if not errors:
        return ""
    return str(errors[0].get("detail", ""))


def _run_param(run_log: Dict[str, Any], name: str, default: Any = "") -> Any:
    for param in run_log.get("data", {}).get("runTimeParameters", []):
        if param.get("variableName") == name:
            return param.get("value", default)
    return default


def _new_cycle_row(cycle: int) -> Dict[str, Any]:
    return {
        "cycle": cycle,
        "status": "INCOMPLETE",
        "started_at": "",
        "completed_at": "",
        "get_pipette_before_p200": "",
        "set_left_p200": "",
        "get_pipette_after_p200": "",
        "set_left_p1000": "",
        "get_pipette_after_p1000": "",
        "set_left_p20": "",
        "get_pipette_after_p20": "",
        "retry_count": 0,
        "reopen_count": 0,
        "ports_seen": "",
        "retry_commands": "",
        "last_message": "",
    }


def build_report_rows(run_log: Dict[str, Any]) -> List[Dict[str, Any]]:
    rows: Dict[int, Dict[str, Any]] = {}
    ports_by_cycle: Dict[int, set[str]] = defaultdict(set)
    retry_commands_by_cycle: Dict[int, List[str]] = defaultdict(list)
    current_cycle: Optional[int] = None

    for item in _iter_messages(run_log):
        message = item["message"]

        begin = CYCLE_BEGIN_RE.fullmatch(message)
        if begin:
            current_cycle = int(begin.group(1))
            rows.setdefault(current_cycle, _new_cycle_row(current_cycle))
            rows[current_cycle]["started_at"] = item["started_at"]
            rows[current_cycle]["last_message"] = message
            continue

        complete = CYCLE_COMPLETE_RE.fullmatch(message)
        if complete:
            cycle = int(complete.group(1))
            current_cycle = cycle
            rows.setdefault(cycle, _new_cycle_row(cycle))
            rows[cycle]["status"] = "PASS"
            rows[cycle]["completed_at"] = item["completed_at"]
            rows[cycle]["last_message"] = message
            continue

        response = COMMAND_RESPONSE_RE.fullmatch(message)
        if response:
            cycle = int(response.group(1))
            command = response.group(2)
            raw_response = response.group(3)
            current_cycle = cycle
            rows.setdefault(cycle, _new_cycle_row(cycle))
            rows[cycle][command] = raw_response
            rows[cycle]["last_message"] = message
            continue

        start = COMMAND_START_RE.fullmatch(message)
        if start:
            cycle = int(start.group(1))
            current_cycle = cycle
            rows.setdefault(cycle, _new_cycle_row(cycle))
            rows[cycle]["last_message"] = message
            continue

        retry = RETRY_RE.fullmatch(message)
        if retry and current_cycle is not None:
            command = retry.group(1)
            port = retry.group(2)
            rows.setdefault(current_cycle, _new_cycle_row(current_cycle))
            rows[current_cycle]["retry_count"] += 1
            ports_by_cycle[current_cycle].add(port)
            retry_commands_by_cycle[current_cycle].append(command)
            rows[current_cycle]["last_message"] = message
            continue

        reopen = REOPEN_RE.search(message)
        if reopen and current_cycle is not None:
            port = reopen.group(1)
            rows.setdefault(current_cycle, _new_cycle_row(current_cycle))
            rows[current_cycle]["reopen_count"] += 1
            ports_by_cycle[current_cycle].add(port)
            rows[current_cycle]["last_message"] = message
            continue

        port_seen = PORT_RE.fullmatch(message)
        if port_seen and current_cycle is not None:
            ports_by_cycle[current_cycle].add(port_seen.group(1))
            rows[current_cycle]["last_message"] = message
            continue

        if current_cycle is not None:
            rows.setdefault(current_cycle, _new_cycle_row(current_cycle))
            rows[current_cycle]["last_message"] = message

    error_detail = _first_error_detail(run_log)
    failed_command = ""
    failed_port = ""
    failed_match = FINAL_FAILED_COMMAND_RE.search(error_detail)
    if failed_match:
        failed_command = failed_match.group(1)
        failed_port = failed_match.group(2)

    for cycle, row in rows.items():
        row["ports_seen"] = ";".join(sorted(ports_by_cycle[cycle]))
        row["retry_commands"] = ";".join(retry_commands_by_cycle[cycle])
        if row["status"] != "PASS" and error_detail:
            row["status"] = "FAIL"
            row["failed_command"] = failed_command
            row["failed_port"] = failed_port
            row["error_detail"] = error_detail
        else:
            row["failed_command"] = ""
            row["failed_port"] = ""
            row["error_detail"] = ""

    return [rows[cycle] for cycle in sorted(rows)]


def build_summary_rows(run_log: Dict[str, Any], detail_rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    pass_cycles = sum(1 for row in detail_rows if row["status"] == "PASS")
    fail_cycles = sum(1 for row in detail_rows if row["status"] == "FAIL")
    retry_count = sum(int(row["retry_count"]) for row in detail_rows)
    reopen_count = sum(int(row["reopen_count"]) for row in detail_rows)
    last_cycle = detail_rows[-1]["cycle"] if detail_rows else ""
    error_detail = _first_error_detail(run_log)
    failed_command = ""
    failed_port = ""
    failed_match = FINAL_FAILED_COMMAND_RE.search(error_detail)
    if failed_match:
        failed_command = failed_match.group(1)
        failed_port = failed_match.group(2)

    return [
        {"metric": "run_id", "value": run_log.get("data", {}).get("id", "")},
        {"metric": "status", "value": run_log.get("data", {}).get("status", "")},
        {"metric": "started_at", "value": run_log.get("data", {}).get("startedAt", "")},
        {"metric": "completed_at", "value": run_log.get("data", {}).get("completedAt", "")},
        {"metric": "configured_cycles", "value": _run_param(run_log, "cycles")},
        {"metric": "cycles_started", "value": len(detail_rows)},
        {"metric": "cycles_passed", "value": pass_cycles},
        {"metric": "cycles_failed", "value": fail_cycles},
        {"metric": "last_cycle", "value": last_cycle},
        {"metric": "total_retries", "value": retry_count},
        {"metric": "total_reopens", "value": reopen_count},
        {"metric": "failed_command", "value": failed_command},
        {"metric": "failed_port", "value": failed_port},
        {"metric": "error_detail", "value": error_detail},
    ]


def _write_csv(path: Path, rows: List[Dict[str, Any]], fieldnames: List[str]) -> None:
    with path.open("w", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate CSV reports from a 96ch impact reliability OT3 run JSON."
    )
    parser.add_argument("run_json", type=Path, help="OT3 run JSON file")
    parser.add_argument(
        "--output-prefix",
        type=Path,
        default=None,
        help="Output path prefix. Defaults to the input filename without suffix.",
    )
    args = parser.parse_args()

    with args.run_json.open() as file:
        run_log = json.load(file)

    output_prefix = args.output_prefix or args.run_json.with_suffix("")
    detail_path = output_prefix.with_name(f"{output_prefix.name}_cycles.csv")
    summary_path = output_prefix.with_name(f"{output_prefix.name}_summary.csv")

    detail_rows = build_report_rows(run_log)
    summary_rows = build_summary_rows(run_log, detail_rows)

    detail_fields = list(_new_cycle_row(0).keys()) + [
        "failed_command",
        "failed_port",
        "error_detail",
    ]
    summary_fields = ["metric", "value"]
    _write_csv(detail_path, detail_rows, detail_fields)
    _write_csv(summary_path, summary_rows, summary_fields)

    print(f"Wrote cycle report: {detail_path}")
    print(f"Wrote summary report: {summary_path}")


if __name__ == "__main__":
    main()
