"""ODD console log snapshot via CDP — collects buffered history, sorts by time, saves."""
import csv
import json
import sys
import time
from typing import List, Tuple

import requests
import websocket


def get_odd_console_logs(
    robot_ip: str,
    storage_directory: str = ".",
    drain_timeout: float = 3.0,
) -> str:
    """Connect to the ODD via CDP, drain all buffered console messages, sort
    chronologically, and save to CSV + TXT.

    Args:
        robot_ip: IP address of the robot.
        storage_directory: Where to save output files.
        drain_timeout: Seconds to wait after the burst stops before giving up.

    Returns:
        Path to the saved CSV file.
    """
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    output_csv = "{}/odd_console_{}.csv".format(storage_directory, timestamp)
    output_txt = "{}/odd_console_{}.txt".format(storage_directory, timestamp)

    # Look up the Opentrons page target
    targets = requests.get(
        "http://{}:9223/json/list".format(robot_ip), timeout=5
    ).json()
    target = next(
        (
            t for t in targets
            if t.get("type") == "page"
            and "opentrons" in (t.get("title") or "").lower()
        ),
        None,
    )
    if target is None:
        target = next((t for t in targets if t.get("type") == "page"), None)
    if target is None:
        print("No page target found on {}".format(robot_ip))
        return ""

    ws_url = target["webSocketDebuggerUrl"].replace("localhost", robot_ip)
    print("Connecting to: {}".format(ws_url))

    ws = websocket.create_connection(ws_url, timeout=10)
    ws.settimeout(drain_timeout)

    for i, method in enumerate(
        ["Runtime.enable", "Log.enable", "Console.enable"], start=1
    ):
        ws.send(json.dumps({"id": i, "method": method}))

    # Collect all entries: (robot_timestamp_ms, level, text)
    entries: List[Tuple[float, str, str]] = []

    print("Draining buffered console messages ({}s timeout)...".format(drain_timeout))
    while True:
        try:
            msg = json.loads(ws.recv())
        except websocket.WebSocketTimeoutException:
            # No more messages in the burst — we're done
            break

        method = msg.get("method", "")
        robot_ts_ms: float = 0.0
        level = ""
        text = ""

        if method == "Runtime.consoleAPICalled":
            args = msg["params"].get("args", [])
            text = " ".join(
                str(a.get("value", a.get("description", ""))) for a in args
            )
            level = msg["params"].get("type", "log").upper()
            robot_ts_ms = float(msg["params"].get("timestamp") or 0)

        elif method == "Log.entryAdded":
            e = msg["params"]["entry"]
            text = e.get("text", "")
            level = e.get("level", "?").upper()
            robot_ts_ms = float(e.get("timestamp") or 0)

        elif method == "Console.messageAdded":
            m = msg["params"]["message"]
            text = m.get("text", "")
            level = m.get("level", "log").upper()
            robot_ts_ms = float(m.get("timestamp") or 0)

        if level and text:
            entries.append((robot_ts_ms, level, text))

    ws.close()

    # Sort chronologically by robot timestamp
    entries.sort(key=lambda e: e[0])

    with open(output_csv, "w", newline="") as csv_file, open(
        output_txt, "w"
    ) as txt_file:
        writer = csv.writer(csv_file)
        writer.writerow(["timestamp", "level", "message"])
        for ts_ms, level, text in entries:
            if ts_ms:
                ts = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(ts_ms / 1000))
            else:
                ts = "unknown"
            line = "[{}] [{}] {}".format(ts, level, text)
            print(line)
            txt_file.write(line + "\n")
            writer.writerow([ts, level, text])

    print("\nSaved {} entries to {}".format(len(entries), output_csv))
    return output_csv


if __name__ == "__main__":
    robot_ip = sys.argv[1] if len(sys.argv) > 1 else "10.14.19.159"
    storage = sys.argv[2] if len(sys.argv) > 2 else "."
    get_odd_console_logs(robot_ip, storage)
