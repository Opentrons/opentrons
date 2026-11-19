"""Demo OT3 Gantry Functionality."""
import argparse
import asyncio
from typing import Any, Dict, List, Optional, Tuple
import datetime
import socket
import sys
import termios
import threading
import time
import tty
import math
from opentrons.hardware_control.ot3api import OT3API
import serial.tools.list_ports  # type: ignore[import-untyped]

from opentrons.hardware_control.types import OT3Mount, Axis, CriticalPoint
from opentrons.types import Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    build_async_ot3_hardware_api,
)

from hardware_testing import data


class RobotPublisher:
    """Tiny TCP server that broadcasts step/position events to a capture client.

    The robot is the server; the laptop capture script connects in. A background
    thread accepts connections so the robot's setup/jog can proceed while the
    capture program connects. Messages are newline-terminated text:
        START                          -> begin recording
        STEP,<i>,<z>,<enc>,<rel>       -> current step + positions (mm)
        STOP                           -> stop recording
    """

    def __init__(self, port: int = 5005, host: str = "0.0.0.0") -> None:
        self._srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self._srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self._srv.bind((host, port))
        self._srv.listen(1)
        self._srv.settimeout(1.0)
        self._clients: List[socket.socket] = []
        self._lock = threading.Lock()
        self._stop = threading.Event()
        self._quit = threading.Event()  # set when the capture asks us to stop
        self._ready = threading.Event()  # set when capture sends READY
        self._thread = threading.Thread(target=self._accept_loop, daemon=True)
        self._thread.start()

    def _accept_loop(self) -> None:
        while not self._stop.is_set():
            try:
                conn, addr = self._srv.accept()
            except socket.timeout:
                continue
            except OSError:
                break
            with self._lock:
                self._clients.append(conn)
            print(f"[bridge] capture program connected from {addr[0]}")
            print("[bridge] waiting for READY from capture before starting steps")
            # Listen on this connection for READY / QUIT from the capture program.
            threading.Thread(
                target=self._client_reader, args=(conn,), daemon=True
            ).start()

    def _client_reader(self, conn: socket.socket) -> None:
        conn.settimeout(1.0)
        buf = ""
        while not self._stop.is_set():
            try:
                data = conn.recv(256)
            except socket.timeout:
                continue
            except OSError:
                break
            if not data:
                break
            buf += data.decode("ascii", errors="ignore")
            while "\n" in buf:
                line, buf = buf.split("\n", 1)
                msg = line.strip()
                if msg == "READY":
                    print("[bridge] READY received — capture is live")
                    self._ready.set()
                elif msg in ("QUIT", "STOP"):
                    self._quit.set()

    def has_client(self) -> bool:
        with self._lock:
            return len(self._clients) > 0

    def client_ready(self) -> bool:
        """True once capture has connected and sent READY (sensor open)."""
        return self._ready.is_set()

    def quit_requested(self) -> bool:
        return self._quit.is_set()

    def send(self, msg: str) -> None:
        data = (msg + "\n").encode("ascii")
        with self._lock:
            for c in list(self._clients):
                try:
                    c.sendall(data)
                except OSError:
                    self._clients.remove(c)

    def close(self) -> None:
        self._stop.set()
        with self._lock:
            for c in self._clients:
                try:
                    c.close()
                except OSError:
                    pass
            self._clients.clear()
        try:
            self._srv.close()
        except OSError:
            pass


def _dict_keys_to_line(dict: Dict[str, str]) -> str:
    return str.join(",", list(dict.keys())) + "\n"


def file_setup(
    test_data: Dict[str, Any], details: List[Optional[str]]
) -> Tuple[str, str]:
    """Sets up the testing files."""
    today = datetime.date.today()
    test_name = "{}-tip_length-test".format(
        details[0],  # Pipette id
    )
    test_header = _dict_keys_to_line(test_data)
    test_tag = "-{}".format(today.strftime("%b-%d-%Y"))
    test_id = data.create_run_id()
    test_path = data.create_folder_for_test_data(test_name)
    test_file = data.create_file_name(test_name, test_id, test_tag)
    data.append_data_to_file(test_name, test_id, test_file, test_header)
    print("FILE PATH = ", test_path)
    print("FILE NAME = ", test_file)
    return test_name, test_file


def getch() -> str:
    """This functions gets a single input keyboard character from the user.

    fd: file descriptor stdout, stdin, stderr
    """
    ch = ""
    fd = sys.stdin.fileno()
    old_settings = termios.tcgetattr(fd)
    try:
        tty.setraw(fd)
        ch = sys.stdin.read(1)
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
    return ch


async def jog(
    api: OT3API, position: Dict[Axis, float], cp: CriticalPoint
) -> Dict[Axis, float]:
    """Jog the given axis a specified distance (mm)."""
    step_size = [0.01, 0.05, 0.1, 0.5, 1, 10, 20, 50]
    step_length_index = 3
    xy_speed = 60
    za_speed = 65
    information_str = """
        Click  >>   i   << to move up
        Click  >>   k   << to move down
        Click  >>   a  << to move left
        Click  >>   d  << to move right
        Click  >>   w  << to move forward
        Click  >>   s  << to move back
        Click  >>   +   << to Increase the length of each step
        Click  >>   -   << to decrease the length of each step
        Click  >> Enter << to save position
        Click  >> q << to quit the test script
                    """
    print(information_str)
    while True:
        input = getch()
        if input == "a":
            # minus x direction
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(-step_size[step_length_index], 0, 0), speed=xy_speed
            )

        elif input == "d":
            # plus x direction
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(step_size[step_length_index], 0, 0), speed=xy_speed
            )

        elif input == "w":
            # minus y direction
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(0, step_size[step_length_index], 0), speed=xy_speed
            )

        elif input == "s":
            # plus y direction
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(0, -step_size[step_length_index], 0), speed=xy_speed
            )

        elif input == "i":
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(0, 0, step_size[step_length_index]), speed=za_speed
            )

        elif input == "k":
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(0, 0, -step_size[step_length_index]), speed=za_speed
            )

        elif input == "q":
            sys.stdout.flush()
            print("TEST CANCELLED")
            quit()

        elif input == "+":
            sys.stdout.flush()
            step_length_index = step_length_index + 1
            if step_length_index >= 7:
                step_length_index = 7

        elif input == "-":
            sys.stdout.flush()
            step_length_index = step_length_index - 1
            if step_length_index <= 0:
                step_length_index = 0

        elif input == "\r":
            sys.stdout.flush()
            position = await api.current_position_ot3(
                mount, refresh=True, critical_point=cp
            )
            print("\r\n")
            return position
            
        position = await api.current_position_ot3(
            mount, refresh=True, critical_point=cp
        )
        print(
            "Coordinates: ",
            round(position[Axis.X], 2),
            ",",
            round(position[Axis.Y], 2),
            ",",
            round(position[Axis.by_mount(mount)], 2),
            " Motor Step: ",
            step_size[step_length_index],
            end="",
        )

        print("\r", end="")


async def move_to_point(
    api: OT3API, mount: OT3Mount, point: Point, cp: CriticalPoint
) -> None:
    """Move the mount to a specified point on the deck."""
    home_pos = api.get_instrument_max_height(mount, cp)
    pos = await api.current_position_ot3(mount, refresh=True, critical_point=cp)
    await api.move_to(mount, Point(pos[Axis.X], pos[Axis.Y], home_pos))
    await api.move_to(mount, Point(point.x, point.y, home_pos))
    await api.move_to(mount, Point(point.x, point.y, point.z))


async def _main() -> None:
    # tips_to_use = 96
    slot_loc = {
        "A1": (13.42, 394.92, 110),
        "A2": (177.32, 394.92, 110),
        "A3": (341.03, 394.92, 110),
        "B1": (13.42, 288.42, 110),
        "B2": (177.32, 288.92, 110),
        "B3": (341.03, 288.92, 110),
        "C1": (13.42, 181.92, 110),
        "C2": (177.32, 181.92, 110),
        "C3": (341.03, 181.92, 110),
        "D1": (13.42, 75.5, 110),
        "D2": (177.32, 75.5, 110),
        "D3": (341.03, 75.5, 110),
    }
    hw_api = await build_async_ot3_hardware_api(
        is_simulating=args.simulate, use_defaults=True
    )
    increment = -0.06  # mm per step on the Z axis
    num_steps = 115   # actuation normally completes by ~70 steps (7 mm of travel)
    settle_s = 1.0   # after a step, let the pipette stop ringing before recording
    plateau_s = 3.0  # hold each plateau this long so the sensor logs a clean value
    # Bridge to the laptop capture program (skip when simulating).
    publisher: Optional[RobotPublisher] = None
    if not args.no_bridge:
        publisher = RobotPublisher(port=args.bridge_port)
        print(f"[bridge] listening on TCP port {args.bridge_port} for capture program")
    try:
        # home gantry and cache instruments
        await hw_api.home()
        await hw_api.cache_instruments()
        # Home Plunger
        await hw_api.home_plunger(mount)
        # pipette_id = hw_api._pipette_handler.hardware_instruments[OT3Mount.LEFT]._pipette_id  # type: ignore
        # details = [pipette_id]
        # test_n, test_f = file_setup(dial_data, details)

        # Constant offsets (mm) from the post-home pose to tip-rack alignment.
        RACK_OFFSET_X = -330.82
        RACK_OFFSET_Y = -230.81
        RACK_OFFSET_Z = -169.49

        cp = CriticalPoint.NOZZLE
        pos = await hw_api.current_position_ot3(mount, refresh=True, critical_point=cp)
        cur_x = pos[Axis.X]
        cur_y = pos[Axis.Y]
        cur_z = pos[Axis.by_mount(mount)]
        print(f"Current Position: ({cur_x:.2f}, {cur_y:.2f}, {cur_z:.2f})")

        rack_x = cur_x + RACK_OFFSET_X
        rack_y = cur_y + RACK_OFFSET_Y
        rack_z = cur_z + RACK_OFFSET_Z
        print(
            f"Current: ({cur_x:.2f}, {cur_y:.2f}, {cur_z:.2f}) → "
            f"tip rack: ({rack_x:.2f}, {rack_y:.2f}, {rack_z:.2f}) "
            f"[offset ({RACK_OFFSET_X}, {RACK_OFFSET_Y}, {RACK_OFFSET_Z})]"
        )

        await move_to_point(hw_api, mount, Point(rack_x, rack_y, rack_z), cp)
        print("Moved over tip rack")
        print("Current Position: ", await hw_api.current_position_ot3(mount, critical_point=cp))
        # zero pipette position
        # place pipette over tip rack 
        print("Jog down until sheath is unsheathed, then press Enter")
        current_position = await hw_api.current_position_ot3(mount, critical_point=cp)
        # jog z axis down until sheath is unsheathed
        unsheath_pos = await jog(hw_api, current_position, cp)
        
        zero_position = await hw_api.current_position_ot3(
            mount, refresh=True, critical_point=cp
        )
        z_enc = await hw_api.encoder_current_position_ot3(
            mount, refresh=True, critical_point=cp
        )
        print("Zeroed at Z: ", round(zero_position[Axis.by_mount(mount)], 3))
        print(
                "Step: ", 0,
                " Z: ", round(zero_position[Axis.by_mount(mount)], 3),
                " Encoder: ", round(z_enc[Axis.by_mount(mount)], 3),
                " Rel: ", round(0, 3),
            )
        # Do not start stepping until capture is up and has sent READY. A bare
        # TCP connect is not enough (it can happen during jog, before the
        # sensor is open). READY is the real start trigger.
        if publisher is not None:
            if not publisher.client_ready():
                print(
                    "Waiting for capture READY before first step ...\n"
                    "  On the laptop, run:\n"
                    "  python \"HES Capture Script.py\" --robot-ip <this-robot-ip>"
                )
            while not publisher.client_ready():
                if publisher.quit_requested():
                    print("[bridge] capture asked to quit before starting.")
                    return
                await asyncio.sleep(0.1)
            zero_z = zero_position[Axis.by_mount(mount)]
            publisher.send("START")
            publisher.send(
                "STEP,0,{:.4f},{:.4f},0.0000".format(
                    zero_z, z_enc[Axis.by_mount(mount)]
                )
            )
            print("[bridge] START sent; beginning step run.")
            # Hold the zero plateau so the capture logs step 0 before we move.
            await asyncio.sleep(plateau_s)
        for i in range(1, num_steps + 1):
            # Stop early if the capture program reports the angle has plateaued.
            if publisher is not None and publisher.quit_requested():
                print("[bridge] capture reported angle plateau - stopping early.")
                break
            # Tell the capture we're raising the pipette: it stops recording until
            # we announce the next plateau, so nothing is logged mid-motion.
            if publisher is not None:
                publisher.send("MOVING")
            # raise z axis in 0.1mm increments until sheath goes back to zero position
            await hw_api.move_rel(mount, Point(0, 0, increment), speed=5)
            # let the pipette stop ringing before we read/record the plateau.
            await asyncio.sleep(settle_s)
            position = await hw_api.current_position_ot3(
                mount, refresh=True, critical_point=cp
            )
            encoder_pos = await hw_api.encoder_current_position_ot3(
                mount=mount, critical_point=cp
            )
            z_pos = position[Axis.by_mount(mount)]
            z_enc = encoder_pos[Axis.by_mount(mount)]
            rel_pos = z_pos - zero_position[Axis.by_mount(mount)]

            # Announce this plateau: the capture resumes recording and tags every
            # sample it takes during the hold below with this step index.
            if publisher is not None:
                publisher.send(
                    "STEP,{},{:.4f},{:.4f},{:.4f}".format(i, z_pos, z_enc, rel_pos)
                )
            # Hold the plateau so the sensor logs a clean settled value for step i.
            await asyncio.sleep(plateau_s)

            # data_line = "{},{},{},{}\n".format(i, z_pos, z_enc, rel_pos)
            # data.append_data_to_file(test_n, test_f, data_line)

            print(
                "Step: ", i, "out of", num_steps,
                " Z: ", round(z_pos, 3),
                " Encoder: ", round(z_enc, 3),
                " Rel: ", round(rel_pos, 3),
            )
        # Don't record the final homing move — mark it as motion.
        if publisher is not None:
            publisher.send("MOVING")
        await hw_api.home_z(mount)

    except KeyboardInterrupt:
        await hw_api.disengage_axes([Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R])
    finally:
        if publisher is not None:
            publisher.send("STOP")
            publisher.close()
        await hw_api.disengage_axes([Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R])
        await hw_api.clean_up()


if __name__ == "__main__":
    slot_locs = [
        "A1",
        "A2",
        "A3",
        "B1",
        "B2",
        "B3:",
        "C1",
        "C2",
        "C3",
        "D1",
        "D2",
        "D3",
    ]
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--tiprack", action="store_true")
    parser.add_argument("--mount", type=str, choices=["left", "right"], default="left")
    parser.add_argument("--tiprack_slot", type=str, choices=slot_locs, default="C1")
    parser.add_argument("--dial_slot", type=str, choices=slot_locs, default="C2")
    parser.add_argument("--dial_indicator", action="store_true")
    parser.add_argument("--tip_size", type=str, default="T200", help="Tip Size")
    parser.add_argument("--tips_to_use", type=int, default=96)
    parser.add_argument("--channel", type=int, default=1)
    parser.add_argument(
        "--bridge_port",
        type=int,
        default=5005,
        help="TCP port the capture program connects to for the start trigger",
    )
    parser.add_argument(
        "--no_bridge",
        action="store_true",
        help="Disable the capture-program trigger (run robot only)",
    )
    args = parser.parse_args()
    if args.mount == "left":
        mount = OT3Mount.LEFT
    else:
        mount = OT3Mount.RIGHT

    asyncio.run(_main())