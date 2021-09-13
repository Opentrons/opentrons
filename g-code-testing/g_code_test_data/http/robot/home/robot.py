import asyncio

from opentrons import ThreadManager

from g_code_test_data.http.http_base import HTTPBase
from robot_server.service.legacy.routers.control import post_home_robot  # type: ignore
from robot_server.service.legacy.models.control import RobotHomeTarget  # type: ignore
from robot_server.service.dependencies import get_motion_lock  # type: ignore


class RobotHomeRobot(HTTPBase):

    @staticmethod
    def main(hardware: ThreadManager):
        return post_home_robot(
            hardware=hardware,
            robot_home_target=RobotHomeTarget(target='robot'),
            motion_lock=asyncio.run(get_motion_lock())
        )