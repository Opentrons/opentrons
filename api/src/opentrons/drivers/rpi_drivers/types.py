from __future__ import annotations
import enum
from itertools import groupby
from dataclasses import dataclass
from typing import List, Optional, Tuple
from opentrons.hardware_control.types import BoardRevision


class PinDir(enum.Enum):
    rev_input = enum.auto()
    input = enum.auto()
    output = enum.auto()


REV_OG_USB_PORTS = {"3": 1, "5": 2}
REV_A_USB_HUB = 3


@dataclass(frozen=True)
class USBPort:
    name: str
    port_number: int
    device_path: str = ""
    hub: Optional[int] = None

    @classmethod
    def build(cls, port_path: str, board_revision: BoardRevision) -> "USBPort":
        """
        Build a USBPort dataclass.

        An example port path:
        `1-1.3/1-1.3:1.0/tty/ttyACM1/dev`

        Args:
            port_path: Full path of a usb device
            board_revision: Board revision

        Returns:
            Tuple of the port number, hub and name
        """
        full_name, device_path = port_path.split(":")
        port_nodes = cls.get_unique_nodes(full_name)
        hub, port, name = cls.find_hub(port_nodes)
        hub, port = cls.map_to_revision(
            board_revision,
            (
                hub,
                port,
            ),
        )
        return cls(name=name, port_number=port, device_path=device_path, hub=hub)

    @staticmethod
    def find_hub(port_nodes: List[str]) -> Tuple[Optional[int], int, str]:
        """
        Find Hub.

        Here we need to determine if a port is a hub
        or not. A hub path might look like:
        `1-1.4/1-1.4/1-1.4.1/1-1.4.1`. When this function
        is used, the nodes will look like: ['1-1.4', '1-1.4.1'].
        This function will then be used to check if it is a
        port hub based on the values given. In the case of the
        example above, it will determine this device is
        connected to a hub and return both the port and
        the hub number. The hub would always be the first number,
        in this case `4` and the port number of the hub would be `1`.

        :param port_nodes: A list of unique port id(s)
        :returns: Tuple of the port number, hub and name
        """
        if len(port_nodes) > 1:
            port_info = port_nodes[1].split(".")
            hub: Optional[int] = int(port_info[1])
            port = int(port_info[2])
            name = port_nodes[1]
        else:
            port = int(port_nodes[0].split(".")[1])
            hub = None
            name = port_nodes[0]
        return hub, port, name

    @staticmethod
    def get_unique_nodes(full_name: str) -> List[str]:
        """
        Get Unique Nodes.

        A path might look like: `1-1.3/1-1.3`. In this
        instance we know that the device is on Bus 1 and
        port 3 of the pi. We only need one unique id
        here, so we will filter it out.

        :param full_name: Full path of the physical
        USB Path.
        :returns: List of separated USB port paths
        """
        port_nodes = []
        for node in full_name.split("/"):
            if node not in port_nodes:
                port_nodes.append(node)
        return port_nodes

    @staticmethod
    def map_to_revision(
        board_revision: BoardRevision, port_info: Tuple[Optional[int], int]
    ) -> Tuple[Optional[int], int]:
        hub, port = port_info
        if board_revision == BoardRevision.OG:
            if hub:
                return REV_OG_USB_PORTS.get(str(hub), hub), port
            else:
                return hub, REV_OG_USB_PORTS.get(str(port), port)
        else:
            if hub and hub == REV_A_USB_HUB:
                return None, port
            else:
                return hub, port

    def __hash__(self) -> int:
        """
        Hash function.

        To have a unique set of nodes, they must
        all have a unique hash. Lists are not
        hashable which is why we need to unpack
        the list here.
        """
        return hash(self.name)


class GPIOPin:
    @classmethod
    def build(cls, name: str, in_out: PinDir, pin: int) -> GPIOPin:
        # use this method if the pin number is the same
        # across all board revisions
        return cls(name, in_out, rev_og=pin, rev_a=pin, rev_b=pin, rev_c=pin)

    @classmethod
    def build_with_rev(
        cls, name: str, in_out: PinDir, **kwargs: Optional[int]
    ) -> GPIOPin:
        return cls(name, in_out, **kwargs)

    def __init__(
        self,
        name: str,
        in_out: PinDir,
        rev_og: Optional[int] = None,
        rev_a: Optional[int] = None,
        rev_b: Optional[int] = None,
        rev_c: Optional[int] = None,
    ):
        self.name = name
        self.in_out = in_out
        self.rev_og = rev_og
        self.rev_a = rev_a
        self.rev_b = rev_b
        self.rev_c = rev_c

    def by_board_rev(self, board_rev: BoardRevision) -> Optional[int]:
        ref = {
            BoardRevision.OG: self.rev_og,
            BoardRevision.A: self.rev_a,
            BoardRevision.B: self.rev_b,
            BoardRevision.C: self.rev_c,
            BoardRevision.UNKNOWN: self.rev_og,
        }
        return ref[board_rev]


class GPIOGroup:
    def __init__(self, pins: List[GPIOPin]):
        self.pins = pins

    def __getattr__(self, item: str) -> GPIOPin:
        res = next(filter(lambda x: x.name is item, self.pins), None)
        assert res, f"Failed to find GPIOPin named: {item}"
        return res

    def by_type(self, pin_dir: PinDir) -> GPIOGroup:
        return GPIOGroup(list(filter(lambda x: x.in_out is pin_dir, self.pins)))

    def by_names(self, names: List[str]) -> GPIOGroup:
        return GPIOGroup(list(filter(lambda x: x.name in names, self.pins)))

    def group_by_pins(self, board_rev: BoardRevision) -> List[List[GPIOPin]]:
        c = groupby(self.pins, key=lambda x: x.by_board_rev(board_rev))
        l: List[List[GPIOPin]] = []
        for k, v in c:
            l.append(list(v))
        return l


gpio_group = GPIOGroup(
    [
        # revision pins (input)
        GPIOPin.build("rev_0", PinDir.rev_input, 17),
        GPIOPin.build("rev_1", PinDir.rev_input, 27),
        # output pins
        GPIOPin.build("frame_leds", PinDir.output, 6),
        GPIOPin.build("blue_button", PinDir.output, 13),
        GPIOPin.build("halt", PinDir.output, 18),
        GPIOPin.build("green_button", PinDir.output, 19),
        GPIOPin.build("audio_enable", PinDir.output, 21),
        GPIOPin.build("isp", PinDir.output, 23),
        GPIOPin.build("reset", PinDir.output, 24),
        GPIOPin.build("red_button", PinDir.output, 26),
        # input pins
        GPIOPin.build("button_input", PinDir.input, 5),
        GPIOPin.build_with_rev("door_sw_filt", PinDir.input, rev_og=20, rev_a=12),
        GPIOPin.build_with_rev("window_sw_filt", PinDir.input, rev_og=20, rev_a=16),
        GPIOPin.build("window_door_sw", PinDir.input, 20),
    ]
)
