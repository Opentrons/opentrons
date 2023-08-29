from typing import Tuple
import serial  # type: ignore[import]
import threading
from queue import Queue
import time

QUEUE_WRITE_ITEM = Tuple[serial.Serial, bytes]

QUEUE_TYPE = "Queue[QUEUE_WRITE_ITEM]"


def _try_write_all_data(serial: serial.Serial, data: bytes) -> None:
    sent = 0
    tries = 0
    if len(data) == 0:
        return
    while sent < len(data):
        try:
            sent += serial.write(data[sent:])
        except Exception as e:
            # Any exception means we need to quit
            print(f"Failed to write: {e}")
            return
        if sent < len(data):
            tries += 1
            # Extremely short sleep to try to avoid battering the CPU
            print(f"DELAYED: sent {sent} of {len(data)} (try {tries})")
            time.sleep(0.01)


def _worker(queue: QUEUE_TYPE) -> None:
    while True:
        ser, data = queue.get()
        # print(f'Sending {len(data)} bytes to {ser}')
        _try_write_all_data(ser, data)


def create_worker_thread() -> Tuple[threading.Thread, QUEUE_TYPE]:
    """Create a serial worker thread. Returns the comms queue."""
    queue: QUEUE_TYPE = Queue(0)
    thread = threading.Thread(
        target=_worker, name="serial worker", kwargs={"queue": queue}
    )

    return (thread, queue)
