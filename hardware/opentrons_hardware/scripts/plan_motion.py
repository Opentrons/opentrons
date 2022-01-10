"""A simple script to create a motion plan."""
import os
import json
import logging
from logging.config import dictConfig
import argparse

from opentrons_hardware.hardware_control.motion_planning import move_manager
from opentrons_hardware.hardware_control.motion_planning.types import (
    Axis,
    AxisConstraints,
    SystemConstraints,
    MoveTarget,
    Coordinates,
)


log = logging.getLogger(__name__)

LOG_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "basic": {"format": "%(asctime)s %(name)s %(levelname)s %(message)s"}
    },
    "handlers": {
        "stream_handler": {
            "class": "logging.StreamHandler",
            "formatter": "basic",
            "level": logging.INFO,
        },
    },
    "loggers": {
        "": {
            "handlers": ["stream_handler"],
            "level": logging.INFO,
        },
    },
}


def main() -> None:
    """Entry point."""
    dictConfig(LOG_CONFIG)

    parser = argparse.ArgumentParser(description="Motion planning script.")
    parser.add_argument(
        "--params-file-path",
        type=str,
        required=False,
        default=os.path.join(os.path.dirname(__file__) + '/motion_params.json'),
        help="the parameter file path"
    )
    args = parser.parse_args()

    with open(args.params_file_path, "r") as f:
        params = json.load(f)

    constraints: SystemConstraints = {
        axis: AxisConstraints.build(
            **params['constraints'][axis.name]) for axis in Axis
    }
    origin = Coordinates(*params['origin'])
    target_list = [
        MoveTarget.build(
            Coordinates(*target['coordinates']), target['max_speed'])
            for target in params['target_list']
    ]

    manager = move_manager.MoveManager(constraints=constraints)
    manager.plan_motion(origin=origin, target_list=target_list)


if __name__ == "__main__":
    main()
