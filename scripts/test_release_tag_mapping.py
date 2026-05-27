"""Regression tests for OT-2 calendar semver and build version helpers.

Run from repository root:

    python3 -m unittest discover -s scripts -p test_release_tag_mapping.py -v

CI: .github/workflows/scripts-release-tag-tests.yaml runs the same command.
"""

from __future__ import annotations

import sys
import unittest
from datetime import date
from pathlib import Path

_SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(_SCRIPTS))

import ot2_calendar_semver as ot2_calendar_semver  # noqa: E402
import python_build_utils as python_build_utils  # noqa: E402


class TestOt2CalendarTagRegex(unittest.TestCase):
    def test_internal_tag_regex_accepts(self):
        for tag in (
            "internal@26.5.2601",
            "internal@26.5.2602-alpha",
            "internal@26.5.2602-beta",
        ):
            with self.subTest(tag=tag):
                self.assertIsNotNone(ot2_calendar_semver.OT2_INTERNAL_TAG_RE.match(tag), tag)

    def test_external_tag_regex_accepts(self):
        for tag in (
            "v26.6.0",
            "v26.6.0-alpha.0",
            "v26.6.0-beta.1",
        ):
            with self.subTest(tag=tag):
                self.assertIsNotNone(ot2_calendar_semver.OT2_EXTERNAL_TAG_RE.match(tag), tag)

    def test_version_from_tag_helpers(self):
        self.assertEqual(
            ot2_calendar_semver.version_from_internal_tag("internal@26.5.2601-alpha"),
            "26.5.2601-alpha",
        )
        self.assertEqual(
            ot2_calendar_semver.version_from_external_tag("v26.6.0-alpha.0"),
            "26.6.0-alpha.0",
        )


class TestOt2InternalSemver(unittest.TestCase):
    def test_encode_decode_may_26(self):
        self.assertEqual(
            ot2_calendar_semver.encode_ot2_internal_version(2026, 5, 26, 1),
            "26.5.2601",
        )
        self.assertEqual(
            ot2_calendar_semver.decode_ot2_internal_version("26.5.2601-alpha"),
            (2026, 5, 26, 1, "alpha"),
        )

    def test_allocate_next_internal_tag(self):
        existing = {
            "internal@26.5.2601-alpha",
            "internal@26.5.2601",
        }
        tag = ot2_calendar_semver.allocate_next_internal_tag(
            existing,
            "alpha",
            release_date=date(2026, 5, 26),
        )
        self.assertEqual(tag, "internal@26.5.2602-alpha")


class TestOt2ExternalSemver(unittest.TestCase):
    def test_encode_decode_june_first(self):
        self.assertEqual(
            ot2_calendar_semver.encode_ot2_external_version(2026, 6, 0),
            "26.6.0",
        )
        self.assertEqual(
            ot2_calendar_semver.decode_ot2_external_version("26.6.0-alpha.0"),
            (2026, 6, 0, "alpha", 0),
        )

    def test_allocate_next_external_stable(self):
        existing = {"v26.6.0", "v26.6.1"}
        tag = ot2_calendar_semver.allocate_next_external_tag(
            existing,
            "stable",
            release_date=date(2026, 6, 15),
        )
        self.assertEqual(tag, "v26.6.2")

    def test_allocate_next_external_alpha(self):
        existing = {"v26.6.0-alpha.0", "v26.6.0"}
        tag = ot2_calendar_semver.allocate_next_external_tag(
            existing,
            "alpha",
            base_version="26.6.0",
            release_date=date(2026, 6, 15),
        )
        self.assertEqual(tag, "v26.6.0-alpha.1")


class TestPythonBuildUtilsRobotStackInternal(unittest.TestCase):
    def test_pep440_internal(self):
        self.assertEqual(
            python_build_utils._pep440_from_git_version(
                "robot-stack-internal", "26.5.2601-alpha"
            ),
            "26.5.2601-alpha",
        )

    def test_pep440_external(self):
        self.assertEqual(
            python_build_utils._pep440_from_git_version("robot-stack", "26.6.0-alpha.0"),
            "26.6.0-alpha.0",
        )


if __name__ == "__main__":
    unittest.main()
