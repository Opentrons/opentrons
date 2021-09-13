import asyncio
from opentrons import ThreadManager
from g_code_test_data.http.http_base import HTTPBase
from robot_server.service.legacy.routers.control import post_move_robot
from robot_server.service.legacy.models.control import RobotMoveTarget
from robot_server.service.dependencies import get_motion_lock


class RobotMoveLeftPipette(HTTPBase):

    @staticmethod
    def main(hardware: ThreadManager):
        return post_move_robot(
            hardware=hardware,
            robot_move_target=RobotMoveTarget(
                target='pipette',
                point=[
                    100.0,
                    90.0,
                    150.0
                ],
                mount='left'
            ),
            motion_lock=asyncio.run(get_motion_lock())
        )
