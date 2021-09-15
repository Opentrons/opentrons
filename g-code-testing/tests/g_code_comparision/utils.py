import boto3
import pytest
import asyncio

from opentrons import ThreadManager

from robot_server.service.legacy.routers.control import post_home_robot  # type: ignore
from robot_server.service.legacy.models.control import RobotHomeTarget  # type: ignore
from robot_server.service.dependencies import get_motion_lock  # type: ignore


BUCKET_NAME = "g-code-comparison"


def get_master_file(master_file_name: str) -> str:
    s3 = boto3.resource("s3")
    master_file = (
        s3.Object(BUCKET_NAME, master_file_name)
        .get()
        .get("Body")
        .read()
        .decode("utf-8")
    )
    return master_file.strip()
