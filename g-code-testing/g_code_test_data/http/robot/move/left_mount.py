import asyncio
from robot_server.service.legacy.routers.control import post_move_robot
from robot_server.service.legacy.models.control import RobotMoveTarget
from robot_server.service.dependencies import get_motion_lock
from functools import partial


def main():
    target = RobotMoveTarget(
        target='mount',
        point=[
            11.0,
            55.2,
            30.4
        ],
        mount='left'
    )

    return partial(
        post_move_robot,
        robot_move_target=target,
        motion_lock=asyncio.run(get_motion_lock())
    )