"""Robot / app launch profiles for pytest (fake-robot vs real hardware)."""

from __future__ import annotations

from dataclasses import dataclass

FAKE_ROBOT_PROFILE_ID = "fake-robot"
DEFAULT_HARDWARE_ROBOT_NAME = "QA1Potato"
DEV_ROBOT_DISPLAY_NAME = "opentrons-dev"


@dataclass(frozen=True)
class RobotProfile:
    """How to launch the app and which robot to target on the Devices page."""

    profile_id: str
    robot_name: str
    app_mode: str  # "dev" | "packaged"
    opentrons_project: str = "ot3"
    start_robot_server: bool = False
    require_hardware_connection: bool = True
    add_localhost_manual_ip: bool = False


ROBOT_PROFILES: dict[str, RobotProfile] = {
    FAKE_ROBOT_PROFILE_ID: RobotProfile(
        profile_id=FAKE_ROBOT_PROFILE_ID,
        robot_name=DEV_ROBOT_DISPLAY_NAME,
        app_mode="dev",
        opentrons_project="ot3",
        start_robot_server=True,
        require_hardware_connection=False,
        add_localhost_manual_ip=True,
    ),
}


def get_robot_profile(profile_id: str | None) -> RobotProfile | None:
    if not profile_id:
        return None
    try:
        return ROBOT_PROFILES[profile_id]
    except KeyError as exc:
        known = ", ".join(sorted(ROBOT_PROFILES))
        raise ValueError(f"Unknown robot profile {profile_id!r}. Known profiles: {known}") from exc
