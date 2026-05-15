"""Regression tests for calendar / internal release tag helpers.

Run from repository root:

    python3 -m unittest discover -s scripts -p test_release_tag_mapping.py -v

CI: .github/workflows/scripts-release-tag-tests.yaml runs the same command.
"""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

_SCRIPTS = Path(__file__).resolve().parent
_APP_RELEASE = _SCRIPTS / "app-release"


def _load_script(module_name: str, relative_path: str):
    path = _SCRIPTS / relative_path
    spec = importlib.util.spec_from_file_location(module_name, path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot load {path}")
    mod = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = mod
    spec.loader.exec_module(mod)
    return mod


chore_release = _load_script("_chore_release_under_test", "app-release/chore-release.py")
internal_release = _load_script(
    "_internal_release_under_test", "app-release/internal-release.py"
)

sys.path.insert(0, str(_SCRIPTS))
import python_build_utils as python_build_utils  # noqa: E402


class TestChoreReleaseIncrementTag(unittest.TestCase):
    def test_calendar_alpha_bump(self):
        self.assertEqual(
            chore_release.increment_tag("v26.4@alpha.6", "alpha"),
            "v26.4@alpha.7",
        )

    def test_calendar_stable_to_next_alpha(self):
        self.assertEqual(
            chore_release.increment_tag("v26.4", "alpha"),
            "v26.5@alpha.0",
        )

    def test_calendar_year_rollover(self):
        self.assertEqual(
            chore_release.increment_tag("v26.12", "alpha"),
            "v27.1@alpha.0",
        )

    def test_parse_chore_release_branch_semver(self):
        self.assertEqual(
            chore_release.parse_chore_release_branch("chore_release-8.8.0"),
            (8, 8, 0),
        )

    def test_parse_chore_release_branch_calendar(self):
        self.assertEqual(
            chore_release.parse_chore_release_branch("chore_release-26.4"),
            (26, 4, 0),
        )


class TestInternalReleaseHelpers(unittest.TestCase):
    def test_opentrons_calendar_tag_regex_accepts(self):
        cal = internal_release.OPENTRONS_CALENDAR_TAG_RE
        for t in (
            "internal@26.4.23",
            "internal@26.4.23.1",
            "internal@26.4.23-0",
            "internal@26.4.23-1",
            "internal@26.11.9",
        ):
            with self.subTest(tag=t):
                self.assertIsNotNone(cal.match(t), t)

    def test_opentrons_calendar_tag_regex_rejects(self):
        cal = internal_release.OPENTRONS_CALENDAR_TAG_RE
        for t in (
            "internal@26.04.23",
            "internal@26.4.03",
            "internal@26.4.23-dev",
            "internal@v23",
            "internal@2.8.0-alpha.5",
            "v26.04",
        ):
            with self.subTest(tag=t):
                self.assertIsNone(cal.match(t), t)

    def test_get_next_tag_numeric(self):
        self.assertEqual(
            internal_release.get_next_tag(
                "internal@v23", "internal_numeric", "", 0
            ),
            "internal@v24",
        )

    def test_get_next_tag_alpha(self):
        self.assertEqual(
            internal_release.get_next_tag(
                None, "internal_alpha", "2.8.0", 6
            ),
            "internal@2.8.0-alpha.6",
        )


class TestPythonBuildUtilsOt3(unittest.TestCase):
    def test_pep440_from_git_calendar(self):
        self.assertEqual(
            python_build_utils._pep440_from_git_version("ot3", "26.4.23"),
            "26.4.23",
        )

    def test_pep440_from_git_same_day_bump(self):
        self.assertEqual(
            python_build_utils._pep440_from_git_version("ot3", "26.4.23.2"),
            "26.4.23.dev2",
        )

    def test_pep440_from_git_hyphen_same_day(self):
        self.assertEqual(
            python_build_utils._pep440_from_git_version("ot3", "26.4.23-0"),
            "26.4.23.dev0",
        )

    def test_pep440_from_git_legacy_channel_rejected(self):
        self.assertEqual(
            python_build_utils._pep440_from_git_version("ot3", "26.4.23-dev.1"),
            "26.4.23-dev.1",
        )

    def test_pep440_robot_stack_calendar_alpha(self):
        self.assertEqual(
            python_build_utils._pep440_from_git_version(
                "robot-stack", "26.4@alpha.3"
            ),
            "26.4a3",
        )


if __name__ == "__main__":
    unittest.main()
