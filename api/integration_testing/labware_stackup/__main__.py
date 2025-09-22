"""Run a full snapshot test of labware stackup logic."""

import argparse
from pathlib import Path
import sys
from . import create_stackups, data, stackup_snapshot_test


def run_cli(argv: list[str]) -> int:
    """Run the tests as a command line program. May exit."""
    parser = add_args(argparse.ArgumentParser())
    args = parser.parse_args(argv)
    filters = create_stackups.filter_from_args(args)
    results = stackup_snapshot_test.run_stackup_snapshot_tests(
        filters=filters,
        update_snapshots=args.update_snapshots,
        snapshot_path=args.snapshot_file,
    )
    print(stackup_snapshot_test.summarize(results, args.ignore_bad_stack))
    return 0 if stackup_snapshot_test.passed(results, args.ignore_bad_stack) else 1


def add_args(parser: argparse.ArgumentParser) -> argparse.ArgumentParser:
    """Add command line flags to an argument parser."""
    parser.description = "Run a full snapshot test of labware stackup logic."
    parser.add_argument(
        "-u",
        "--update-snapshots",
        action="store_true",
        default=False,
        help="Write the results of this test to the snapshots. Note that if you filter, this may delete things you don't want to delete.",
    )
    parser.add_argument(
        "--snapshot-file",
        action="store",
        default=data.SNAPSHOT_PATH_DEFAULT,
        type=Path,
        help="Override the default snapshot file path.",
    )
    bad_stack_group = parser.add_mutually_exclusive_group()
    bad_stack_group.add_argument(
        "--ignore-bad-stack",
        action="store_true",
        dest="ignore_bad_stack",
        default=True,
        help="Do not fail if stacking fails for one of the test specs",
    )
    bad_stack_group.add_argument(
        "--no-ignore-bad-stack",
        action="store_false",
        dest="ignore_bad_stack",
        default=True,
        help="Fail if stacking fails for one of the test specs",
    )
    return create_stackups.add_args(parser)


if __name__ == "__main__":
    sys.exit(run_cli(sys.argv[1:]))
