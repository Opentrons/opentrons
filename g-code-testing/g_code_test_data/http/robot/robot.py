import asyncio
from functools import partial

from robot_server.service.dependencies import get_motion_lock
from g_code_test_data.g_code_configuration import HTTPGCodeConfirmConfig
from g_code_test_data.http.http_settings import HTTP_SETTINGS
from robot_server.service.legacy.routers.control import (
    post_home_robot,
    post_move_robot,
)  # type: ignore
from robot_server.service.legacy.models.control import (
    RobotHomeTarget,
    RobotMoveTarget,
)  # type: ignore


ROBOT_HOME_ROBOT = HTTPGCodeConfirmConfig(
    name='robot_home_robot',
    executable=partial(
        post_home_robot,
        robot_home_target=RobotHomeTarget(target="robot"),
        motion_lock=asyncio.run(get_motion_lock()),
    ),
    settings=HTTP_SETTINGS,
)


ROBOT_HOME_LEFT_PIPETTE = HTTPGCodeConfirmConfig(
    name='robot_home_left_pipette',
    executable=partial(
        post_home_robot,
        robot_home_target=RobotHomeTarget(target="pipette", mount="left"),
        motion_lock=asyncio.run(get_motion_lock()),
    ),
    settings=HTTP_SETTINGS,
)


ROBOT_HOME_RIGHT_PIPETTE = HTTPGCodeConfirmConfig(
    name='robot_home_right_pipette',
    executable=partial(
        post_home_robot,
        robot_home_target=RobotHomeTarget(target="pipette", mount="right"),
        motion_lock=asyncio.run(get_motion_lock()),
    ),
    settings=HTTP_SETTINGS,
)


ROBOT_MOVE_LEFT_MOUNT = HTTPGCodeConfirmConfig(
    name='robot_move_left_mount',
    executable=partial(
        post_move_robot,
        robot_move_target=RobotMoveTarget(
            target="mount", point=[11.0, 55.2, 30.4], mount="left"
        ),
        motion_lock=asyncio.run(get_motion_lock()),
    ),
    settings=HTTP_SETTINGS,
)


ROBOT_MOVE_LEFT_PIPETTE = HTTPGCodeConfirmConfig(
    name='robot_move_left_pipette',
    executable=partial(
        post_move_robot,
        RobotMoveTarget(target="pipette", point=[100.0, 90.0, 150.0], mount="left"),
        motion_lock=asyncio.run(get_motion_lock()),
    ),
    settings=HTTP_SETTINGS,
)


ROBOT_MOVE_RIGHT_MOUNT = HTTPGCodeConfirmConfig(
    name='robot_move_right_mount',
    executable=partial(
        post_move_robot,
        robot_move_target=RobotMoveTarget(
            target="mount", point=[300.0, 43.0, 40.0], mount="right"
        ),
        motion_lock=asyncio.run(get_motion_lock()),
    ),
    settings=HTTP_SETTINGS,
)


ROBOT_MOVE_RIGHT_PIPETTE = HTTPGCodeConfirmConfig(
    name='robot_move_right_pipette',
    executable=partial(
        post_move_robot,
        robot_move_target=RobotMoveTarget(
            target="pipette", point=[10.0, 20.0, 15.0], mount="right"
        ),
        motion_lock=asyncio.run(get_motion_lock()),
    ),
    settings=HTTP_SETTINGS,
)


ROBOT_CONFIGURATIONS = [
    ROBOT_HOME_ROBOT,
    ROBOT_HOME_LEFT_PIPETTE,
    ROBOT_HOME_RIGHT_PIPETTE,
    ROBOT_MOVE_LEFT_MOUNT,
    ROBOT_MOVE_LEFT_PIPETTE,
    ROBOT_MOVE_RIGHT_MOUNT,
    ROBOT_MOVE_RIGHT_PIPETTE,
]