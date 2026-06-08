"""ODD console log snapshot via CDP — collects buffered history, sorts by time, saves."""
import csv
import json
import sys
import time
from typing import List, Tuple
from pathlib import Path
import requests
import websocket



def get_odd_console_logs(
    robot_ip: str,
    storage_directory: str,
) -> str:
    """Connect to the ODD via CDP, drain all buffered console messages, sort
    chronologically, and save to CSV.

    Args:
        robot_ip: IP address of the robot.
        storage_directory: Where to save output files.
        
    Returns:
        Path to the saved CSV file.
    """
    log_buffer = 3.0
    save_directory = Path(storage_directory)
    output_csv = (save_directory) / "odd_console.log"

    # Find the opentrons page target, this is specific to each boot of each robot
    try:
        targets = requests.get(
            f"http://{robot_ip}:9223/json/list", timeout=5
        ).json()
    except Exception as e:
        print(f"Could not reach port 9223 on {robot_ip}: {e}")
        return ""

    target = next(
        (
            t for t in targets
            if t.get("type") == "page"
            and "opentrons" in (t.get("title") or "").lower()
        ),
        None,
    )
    if target is None:
        msg = f"No Opentrons console log target found on {robot_ip}."
        print(msg)
        with open(output_csv, "w", newline="") as csv_file:
            writer = csv.writer(csv_file)
            writer.writerow(["timestamp", "level", "message"])
            writer.writerow([time.strftime("%Y-%m-%d %H:%M:%S"), "ERROR", msg])
        return str(output_csv)

    ws_url = target["webSocketDebuggerUrl"].replace("localhost", robot_ip)
    ws = websocket.create_connection(ws_url, timeout=10)
    # setting a collection time basically
    ws.settimeout(log_buffer)

    for i, method in enumerate(
        ["Runtime.enable", "Log.enable", "Console.enable"], start=1
    ):
        ws.send(json.dumps({"id": i, "method": method}))

    # Collect all entries: (robot_timestamp_ms, level, text)
    entries: List[Tuple[float, str, str]] = []
    while True:
        try:
            msg = json.loads(ws.recv())
        except websocket.WebSocketTimeoutException:
            break

        method = msg.get("method", "")
        robot_ts_ms: float = 0.0
        level = ""
        text = ""

        if method == "Runtime.consoleAPICalled":
            args = msg["params"].get("args", [])
            text = " ".join(
                str(a["value"]) if "value" in a else a.get("description", json.dumps(a))
                for a in args
            )
            level = msg["params"].get("type", "log").upper()
            robot_ts_ms = float(msg["params"].get("timestamp") or 0)

        elif method == "Log.entryAdded":
            e = msg["params"]["entry"]
            raw_text = e.get("text", "")
            text = raw_text if isinstance(raw_text, str) else json.dumps(raw_text)
            level = e.get("level", "?").upper()
            robot_ts_ms = float(e.get("timestamp") or 0)

        elif method == "Console.messageAdded":
            m = msg["params"]["message"]
            raw_text = m.get("text", "")
            text = raw_text if isinstance(raw_text, str) else json.dumps(raw_text)
            level = m.get("level", "log").upper()
            robot_ts_ms = float(m.get("timestamp") or 0)

        if "[object Object]" in text:
            text = f"[unparseable object] raw: {json.dumps(msg['params'])}"

        if level and text:
            entries.append((robot_ts_ms, level, text))

    ws.close()

    # logs come in by log type, so we sort by time
    entries.sort(key=lambda e: e[0])

    with open(output_csv, "w", newline="") as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(["timestamp", "level", "message"])
        for ts_ms, level, text in entries:
            ts = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(ts_ms / 1000)) 
            if not ts_ms:
                ts = "unknown"
            writer.writerow([ts, level, text])

    print(f"\nSaved {len(entries)} entries to {output_csv}")
    return output_csv


if __name__ == "__main__":
    robot_ip = sys.argv[1] if len(sys.argv) > 1 else "10.14.19.202"
    storage = sys.argv[2] if len(sys.argv) > 2 else "/Users/nicholas.shilandopentrons.com/Documents/ODD crap"
    get_odd_console_logs(robot_ip, storage)
