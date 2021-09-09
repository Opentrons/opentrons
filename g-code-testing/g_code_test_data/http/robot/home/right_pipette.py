import asyncio
from robot_server.service.legacy.routers.control import post_home_robot
from robot_server.service.legacy.models.control import RobotHomeTarget
from robot_server.service.dependencies import get_motion_lock
from functools import partial


def main():
    target = RobotHomeTarget(
        target='pipette',
        mount='right'
    )

    return partial(
        post_home_robot,
        robot_home_target=target,
        motion_lock=asyncio.run(get_motion_lock())
    )