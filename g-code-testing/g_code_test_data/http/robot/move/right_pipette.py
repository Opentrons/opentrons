import asyncio
from opentrons import ThreadManager
from g_code_test_data.http.http_base import HTTPBase
from robot_server.service.legacy.routers.control import post_move_robot  # type: ignore
from robot_server.service.legacy.models.control import RobotMoveTarget  # type: ignore
from robot_server.service.dependencies import get_motion_lock  # type: ignore


class RobotMoveRightPipette(HTTPBase):

    @staticmethod
    def main(hardware: ThreadManager):
        return post_move_robot(
            hardware=hardware,
            robot_move_target=RobotMoveTarget(
                target='pipette',
                point=[
                    10.0,
                    20.0,
                    15.0
                ],
                mount='right'
            ),
            motion_lock=asyncio.run(get_motion_lock())
        )
