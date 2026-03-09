from __future__ import annotations
import enum
import re
from itertools import groupby
from dataclasses import dataclass
from typing import List, Optional, Tuple
from opentrons.hardware_control.types import BoardRevision


class PinDir(enum.Enum):
    rev_input = enum.auto()
    input = enum.auto()
    output = enum.auto()


class PortGroup:
    MAIN = "main"
    LEFT = "left"
    RIGHT = "right"
    FRONT = "front"
    UNKNOWN = "unknown"


REV_OG_USB_PORTS = {"3": 1, "5": 2}
REV_A_USB_HUB = 3
FLEX_B2_USB_PORT_GROUP_LEFT = 4
FLEX_B2_USB_PORT_GROUP_RIGHT = 3
FLEX_B2_USB_PORT_GROUP_FRONT = 7
FLEX_B2_USB_PORTS = {"4": 1, "3": 2, "2": 3, "1": 4}

BUS_PATH = "/sys/bus/usb/devices/usb1/"

# Example usb path might look like:
# '/sys/bus/usb/devices/usb1/1-1/1-1.3/1-1.3:1.0/tty/ttyACM1/dev'.
# Example hid device path might look like:
# '/sys/bus/usb/devices/usb1/1-1/1-1.3/1-1.3:1.0/0003:16D0:1199.0002/hidraw/hidraw0/dev'
# There is only 1 bus that supports USB on the raspberry pi.
USB_PORT_INFO = re.compile(
    r"""
    (?P<port_path>(\d[\d]*-\d[\d\.]*[/]?)+):
    (?P<device_path>
        \d.\d/
        (tty/tty(\w{4})/dev | [\w:\.]+?/hidraw/hidraw\d/dev)
    )
    """,
    re.VERBOSE,
)

HUB_PATTERN = re.compile(r"(\d-[\d.]+\d?)[\/:]")


@dataclass(frozen=True)
class USBPort:
    name: str
    port_number: int
    port_group: str = PortGroup.UNKNOWN
    hub: bool = False
    hub_port: Optional[int] = None
    device_path: str = ""

    @classmethod
    def build(
        cls, full_path: str, board_revision: BoardRevision
    ) -> Optional["USBPort"]:
        """
        Build a USBPort dataclass.

        An example port path:
        `1-1.3/1-1.3:1.0/tty/ttyACM1/dev`

        Args:
            port_path: Full path of a usb device
            board_revision: Board revision

        Returns:
            Tuple of the port number, port group, hub, hub port, device path, and name
        """
        match = USB_PORT_INFO.search(full_path)
        if not match:
            return None

        port_path = match.group("port_path")
        device_path = match.group("device_path")
        port_nodes = cls.get_unique_nodes(port_path)
        hub, port, hub_port, name = cls.find_hub(port_nodes, board_revision)
        hub, port_group, port, hub_port = cls.map_to_revision(
            board_revision,
            (
                hub,
                port,
                hub_port,
            ),
        )
        return cls(
            name=name,
            port_number=port,
            port_group=port_group,
            hub=hub,
            hub_port=hub_port,
            device_path=device_path,
        )

    @staticmethod
    def find_hub(
        port_nodes: List[str],
        board_revision: BoardRevision,
    ) -> Tuple[Optional[int], int, Optional[int], str]:
        """
        Find the hub, port, and hub_port data for a USB port from
        the port nodes.

        The last item of the port nodes list is parsed by splitting
        the item at each period. It is parsed as follows:
        'bus.hub.port.hub_port'. The USB bus data is unused. The
        hub_port data is only populated if a USB hub is connected
        to that port. The Flex FRONT USB port is parsed as:
        'bus.hub.hub_port'.

        :param port_nodes: A list of unique port id(s)
        :returns: Tuple of the hub, port number, hub_port and name
        """
        if len(port_nodes) == 1 and "." not in port_nodes[0]:
            # if no hub is attached, such as on a dev kit, the port
            # nodes available will be 1-1
            port = int(port_nodes[0].split("-")[1])
            hub = None
            hub_port = None
            name = port_nodes[0]
        else:
            port_nodes = [node for node in port_nodes if "." in node]
            if len(port_nodes) > 2:
                port_info = port_nodes[2].split(".")
                hub = int(port_info[1])
                port = int(port_info[2])
                hub_port = int(port_info[3])
                name = port_nodes[2]
            elif len(port_nodes) > 1:
                if board_revision == BoardRevision.OG:
                    port_info = port_nodes[1].split(".")
                    hub = int(port_info[1])
                    port = int(port_info[1])
                    hub_port = int(port_info[2])
                    name = port_nodes[1]
                else:
                    port_info = port_nodes[1].split(".")
                    hub = int(port_info[1])
                    name = port_nodes[1]
                    if (board_revision == BoardRevision.FLEX_B2) and (
                        hub == FLEX_B2_USB_PORT_GROUP_FRONT
                    ):
                        port = 9
                        hub_port = int(port_info[2])
                    else:
                        port = int(port_info[2])
                        hub_port = None
            else:
                if board_revision == BoardRevision.FLEX_B2:
                    port_info = port_nodes[0].split(".")
                    hub = int(port_info[1])
                    port = 9
                    hub_port = None
                    name = port_nodes[0]
                else:
                    port = int(port_nodes[0].split(".")[1])
                    hub = None
                    hub_port = None
                    name = port_nodes[0]
        return hub, port, hub_port, name

    @staticmethod
    def get_unique_nodes(full_name: str) -> List[str]:
        """
        Get unique port nodes for a USB port from the USB port path.

        For a Flex or OT-2_R with a USB hub connected to a port,
        the USB port path will look like:
        `1-1.3/1-1.3.2/1-1.3.2.4/1-1.3.2.4`. This will become the
        following 3 port nodes: ['1-1.3', '1-1.3.2', '1-1.3.2.4'].
        The Flex FRONT USB port with a hub connected will look like:
        `1-1.7/1-1.7.4/1-1.7.4` and become ['1-1.7', '1-1.7.4'].

        For a Flex or OT-2_R without a USB hub connected to a port,
        the USB port path will look like: `1-1.3/1-1.3.4/1-1.3.4`.
        This will become the follwing 2 port nodes: ['1-1.3', '1-1.3.4'].
        The Flex FRONT USB port without a hub connected will look like:
        `1-1.7/1-1.7` and become ['1-1.7'].

        For a OT-2_OG with a USB hub connected to a port, the USB
        port path will look like: `1-1.3/1-1.3/1-1.3.3/1-1.3.3`. This will
        become the following 2 port nodes: ['1-1.3', '1-1.3.3'].

        For a OT-2_OG without a USB hub connected to a port, the USB
        port path will look like: `1-1.3/1-1.3`. This will become the
        following 1 port node: ['1-1.3'].

        We only need one unique id here, so we will filter out duplicates.

        :param full_name: Full path of the physical USB Path
        :returns: List of separated USB port paths
        """
        all_match = HUB_PATTERN.findall(full_name)
        match_set = []
        for match in all_match:
            if match not in match_set:
                match_set.append(match)
        return match_set

    @staticmethod
    def map_to_revision(
        board_revision: BoardRevision,
        port_info: Tuple[Optional[int], int, Optional[int]],
    ) -> Tuple[bool, str, int, Optional[int]]:
        """
        Synthesize the hub, port_group, and hub_port data for a USB port
        from the hub and hub_port data.

        If a USB hub is connected to a port, the hub data field is True
        and the hub_port data field is populated. Otherwise, the hub
        data field is False and the hub_port data field is None.

        For the OT-2, there is only one bank of USB ports, so the
        port_group is always MAIN. For the Flex, there are LEFT, RIGHT,
        and FRONT USB port banks, which map to specific hub values.

        For the Flex, the RIGHT port values are increased by 4 to match
        the physical hardware labeling (USB5 - USB8).

        :param port_info: Tuple of the hub, port number, and hub port
        :returns: Tuple of the hub, port group, port number, and hub port
        """
        hub, port, hub_port = port_info
        if board_revision == BoardRevision.OG:
            if hub:
                return (
                    True,
                    PortGroup.MAIN,
                    REV_OG_USB_PORTS.get(str(port), port),
                    hub_port,
                )
            else:
                return (
                    False,
                    PortGroup.MAIN,
                    REV_OG_USB_PORTS.get(str(port), port),
                    None,
                )
        elif board_revision == BoardRevision.FLEX_B2:
            if hub == FLEX_B2_USB_PORT_GROUP_LEFT:
                port_group = PortGroup.LEFT
                port = FLEX_B2_USB_PORTS.get(str(port), port)
            elif hub == FLEX_B2_USB_PORT_GROUP_RIGHT:
                port_group = PortGroup.RIGHT
                port = FLEX_B2_USB_PORTS.get(str(port), port)
                port = port + 4
            elif hub == FLEX_B2_USB_PORT_GROUP_FRONT:
                port_group = PortGroup.FRONT
            else:
                port_group = PortGroup.UNKNOWN
            if hub_port:
                return True, port_group, port, hub_port
            else:
                return False, port_group, port, None
        else:  # any variant of OT2-Refresh
            if hub_port:
                return True, PortGroup.MAIN, port, hub_port
            else:
                return False, PortGroup.MAIN, port, None

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
