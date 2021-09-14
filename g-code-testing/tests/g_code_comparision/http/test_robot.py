from typing import Callable

import pytest
import asyncio

from opentrons import ThreadManager

from robot_server.service.legacy.routers.control import post_home_robot, \
    post_move_robot  # type: ignore
from robot_server.service.legacy.models.control import RobotHomeTarget, \
    RobotMoveTarget  # type: ignore
from robot_server.service.dependencies import get_motion_lock  # type: ignore
from g_code_parsing.g_code_engine import GCodeEngine
from functools import partial
from opentrons.hardware_control.emulation.settings import Settings, SmoothieSettings
from g_code_parsing.g_code_program.supported_text_modes import SupportedTextModes
from g_code_parsing.g_code_differ import GCodeDiffer
from tests.g_code_comparision.utils import get_master_file


@pytest.fixture
def http_settings() -> Settings:
    left = {"model": "p20_single_v2.0", "id": "P20SV202020070101"}
    right = {"model": "p300_single_v2.1", "id": "P20SV202020070101"}

    return Settings(smoothie=SmoothieSettings(left=left, right=right))


def robot_home_robot() -> Callable:
    return partial(
        post_home_robot,
        robot_home_target=RobotHomeTarget(target='robot'),
        motion_lock=asyncio.run(get_motion_lock())
    )


def robot_home_left_pipette() -> Callable:
    return partial(
        post_home_robot,
        robot_home_target=RobotHomeTarget(target='pipette', mount='left'),
        motion_lock=asyncio.run(get_motion_lock())
    )


def robot_home_right_pipette() -> Callable:
    return partial(
        post_home_robot,
        robot_home_target=RobotHomeTarget(target='pipette', mount='right'),
        motion_lock=asyncio.run(get_motion_lock())
    )


def robot_move_left_mount() -> Callable:
    return partial(
        post_move_robot,
        robot_move_target=RobotMoveTarget(
            target='mount',
            point=[
                11.0,
                55.2,
                30.4
            ],
            mount='left'
        ),
        motion_lock=asyncio.run(get_motion_lock())
    )


def robot_move_left_pipette() -> Callable:
    return partial(
        post_move_robot,
        RobotMoveTarget(
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


def robot_move_right_mount() -> Callable:
    return partial(
        post_move_robot,
        robot_move_target=RobotMoveTarget(
            target='mount',
            point=[
                300.0,
                43.0,
                40.0
            ],
            mount='right'
        ),
        motion_lock=asyncio.run(get_motion_lock())
    )


def robot_move_right_pipette() -> Callable:
    return partial(
        post_move_robot,
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


TEST_DATA = [
    ['http-home-robot.txt', robot_home_robot()],
    ['http-home-left-pipette.txt', robot_home_left_pipette()],
    ['http-home-right-pipette.txt', robot_home_right_pipette()],
    ['http-move-left-mount.txt', robot_move_left_mount()],
    ['http-move-left-pipette.txt', robot_move_left_pipette()],
    ['http-move-right-mount.txt', robot_move_right_mount()],
    ['http-move-right-pipette.txt', robot_move_right_pipette()],
]


@pytest.mark.parametrize(
    "master_file_name,executable",
    TEST_DATA
)
def test_robot_home_robot(master_file_name, executable, http_settings):
    expected_output = get_master_file(master_file_name)
    with GCodeEngine(http_settings).run_http(executable=executable) as program:
        actual_output = program.get_text_explanation(SupportedTextModes.CONCISE)

    assert actual_output == expected_output, \
        GCodeDiffer(actual_output, expected_output).get_html_diff()
