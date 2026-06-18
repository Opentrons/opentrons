"""Shared pytest CLI helpers (robot name positional arg, etc.)."""

from __future__ import annotations

from automation.helpers.robot_profiles import FAKE_ROBOT_PROFILE_ID, ROBOT_PROFILES

# Flags that consume the next argv token (do not treat that token as a robot name).
_VALUE_FLAGS = frozenset(
    {
        "-k",
        "-m",
        "--robot-name",
        "--robot-profile",
        "--tb",
        "--maxfail",
        "--rootdir",
        "--confcutdir",
        "--slowmo",
        "--device",
        "--browser",
        "--tracing",
        "--video",
        "--screenshot",
    }
)


def looks_like_robot_name_arg(token: str) -> bool:
    """True when a bare CLI token is a robot name, not a pytest path or flag."""
    if token.startswith("-"):
        return False
    if token.endswith(".py") or "::" in token:
        return False
    if token.startswith("tests") or "/" in token or "\\" in token:
        return False
    return True


def inject_robot_profile_or_name_arg(args: list[str]) -> None:
    """
    Turn ``pytest fake-robot tests/nav/`` into ``pytest --robot-profile fake-robot ...``.

    Turn ``pytest QA1Potato tests/nav/`` into ``pytest --robot-name QA1Potato ...``.

    Scans the full argv list (addopts from pytest.ini may appear before user args).
    Call from ``main_script.py`` or ``pytest_load_initial_conftests`` before pytest
    parses options.
    """
    if "--robot-profile" in args or "--robot-name" in args:
        return

    skip_next = False
    for index, token in enumerate(args):
        if skip_next:
            skip_next = False
            continue
        if token in _VALUE_FLAGS or token.startswith(
            ("--robot-name=", "--robot-profile=")
        ):
            if "=" not in token and token in _VALUE_FLAGS:
                skip_next = True
            continue
        if looks_like_robot_name_arg(token):
            if token in ROBOT_PROFILES:
                args[index : index + 1] = ["--robot-profile", token]
            else:
                args[index : index + 1] = ["--robot-name", token]
            return


def inject_robot_name_arg(args: list[str]) -> None:
    """Backward-compatible alias for ``main_script.py``."""
    inject_robot_profile_or_name_arg(args)


__all__ = [
    "FAKE_ROBOT_PROFILE_ID",
    "inject_robot_name_arg",
    "inject_robot_profile_or_name_arg",
    "looks_like_robot_name_arg",
]
