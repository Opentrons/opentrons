"""Parse the output of network_test.py."""

from typing import BinaryIO, Iterator, Tuple, Set
import argparse

import matplotlib.pyplot as pp

from opentrons_hardware.firmware_bindings.constants import NodeId


def build_args() -> argparse.ArgumentParser:
    """Build arguments."""
    parser = argparse.ArgumentParser(description="Plot the results of network_test.py")
    parser.add_argument(
        "testlog",
        metavar="TEST_LOG",
        help="The log file csv to parse",
        type=argparse.FileType("rb"),
    )
    return parser


_NID_BYTES = {nid.name.encode(): nid for nid in NodeId}


def data_series(
    logfile: BinaryIO, for_id: NodeId
) -> Iterator[Tuple[float, float, bool]]:
    """Pluck the data for a specific node out of the file."""
    lines = iter(logfile)
    next(lines)
    for line in lines:
        if not line:
            continue
        line = line.strip()
        timestamp, nodeid, bits, error = line.split(b",")
        if error == b"False":
            had_error = False
        elif error == b"True":
            had_error = True
        else:
            raise ValueError(error)
        if _NID_BYTES[nodeid] == for_id:
            yield float(timestamp), float(bits), had_error


def all_data_series(
    logfile: BinaryIO,
) -> Iterator[Tuple[NodeId, Iterator[Tuple[float, float, bool]]]]:
    """Build an iterable of series for each node."""
    seen_nodes: Set[NodeId] = set()
    lines = iter(logfile)
    next(lines)
    for line in lines:
        if not line:
            continue
        line = line.strip()
        this_node = _NID_BYTES[line.split(b",")[1]]
        if this_node not in seen_nodes:
            yield this_node, data_series(logfile, this_node)
            seen_nodes.add(this_node)


def run(logfile: BinaryIO) -> None:
    """Plot the passed-in logfile."""
    fig = pp.figure("Bandwidth by node")
    ax = pp.axes(xlabel="elapsed time (s)", ylabel="bits")
    colors = iter(
        [
            "#1f77b4",
            "#ff7f0e",
            "#2ca02c",
            "#d62728",
            "#9467bd",
            "#8c564b",
            "#e377c2",
            "#7f7f7f",
            "#bcbd22",
            "#17becf",
        ]
    )

    for node, series in all_data_series(logfile):
        thiscolor = next(colors)
        values = list(series)
        ax.plot(
            [time for time, _, error in values if not error],
            [bits for _, bits, error in values if not error],
            color=thiscolor,
            marker=".",
            label=f"{node.name}: ok",
        )
        ax.plot(
            [time for time, _, error in values if error],
            [0 for _, _, error in values if error],
            color=thiscolor,
            marker="+",
            label=f"{node.name}: error",
        )
    ax.legend()
    fig.show()
    pp.show()


def main() -> None:
    """Entry point."""
    parser = build_args()
    args = parser.parse_args()
    run(args.testlog)


if __name__ == "__main__":
    main()
