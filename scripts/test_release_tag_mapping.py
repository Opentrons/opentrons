"""Regression tests for OT-2 calendar tag gates used by build/CI.

We test OT2_*_TAG_RE and version_from_* as the tag gate in python_build_utils and
git-version.mjs. We also test _pep440_from_git_version for the one legacy transform
it performs (YY.M@alpha.N to YY.MaN); calendar tails are covered indirectly via the
tag gate and are asserted unchanged in pep440 tests.

Run from repository root:

    python3 -m unittest discover -s scripts -p test_release_tag_mapping.py -v

CI: .github/workflows/scripts-release-tag-tests.yaml runs the same command.
"""

from __future__ import annotations

import sys
import unittest
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
            "internal@26.5.2699-beta",
            "internal@26.5.2801",
            "internal@26.12.3112",
        ):
            with self.subTest(tag=tag):
                self.assertIsNotNone(ot2_calendar_semver.OT2_INTERNAL_TAG_RE.match(tag), tag)

    def test_internal_tag_regex_rejects(self):
        for tag in (
            "internal@26.5.22-1",  # no dash anymore
            "internal@v6",  # no v prefix anymore
            "internal@26.0.2601",  # no 0 month
            "internal@26.13.2601",  # no 13 month
            "internal@26.5.2601-alpha.0",  # no alpha.0 suffix
        ):
            with self.subTest(tag=tag):
                self.assertIsNone(ot2_calendar_semver.OT2_INTERNAL_TAG_RE.match(tag), tag)

    def test_external_tag_regex_accepts(self):
        for tag in (
            "v26.6.0",
            "v26.6.0-alpha.0",
            "v26.6.0-alpha.13",
            "v26.6.0-beta.1",
            "v28.12.0-beta.999",
            "v26.6.9",
        ):
            with self.subTest(tag=tag):
                self.assertIsNotNone(ot2_calendar_semver.OT2_EXTERNAL_TAG_RE.match(tag), tag)

    def test_external_tag_regex_rejects(self):
        for tag in (
            "v26.6.10",  # cannot go past 9
            "v26.6.0-alpha",  # no alpha suffix without number
            "v26.13.0",  # no 13 month
            "v8.9.9-alpha.13",  # not calendar YY format (single-digit year)
        ):
            with self.subTest(tag=tag):
                self.assertIsNone(ot2_calendar_semver.OT2_EXTERNAL_TAG_RE.match(tag), tag)

    def test_version_from_tag_helpers(self):
        self.assertEqual(
            ot2_calendar_semver.version_from_internal_tag("internal@26.5.2601-alpha"),
            "26.5.2601-alpha",
        )
        self.assertEqual(
            ot2_calendar_semver.version_from_internal_tag("internal@26.5.2801"),
            "26.5.2801",
        )
        self.assertIsNone(
            ot2_calendar_semver.version_from_internal_tag("internal@26.5.22-1")
        )
        self.assertEqual(
            ot2_calendar_semver.version_from_external_tag("v26.6.0-alpha.0"),
            "26.6.0-alpha.0",
        )


class TestPep440FromGitVersion(unittest.TestCase):
    def test_legacy_external_yy_m_at_alpha_n(self):
        """Old v tags used 6.1@alpha.0; wheels need 6.1a0."""
        for raw, expected in (
            ("6.1@alpha.0", "6.1a0"),
            ("26.5@alpha.13", "26.5a13"),
        ):
            with self.subTest(raw=raw):
                self.assertEqual(
                    python_build_utils._pep440_from_git_version("robot-stack", raw),
                    expected,
                )

    def test_calendar_external_unchanged(self):
        for raw in (
            "26.6.0",
            "26.6.0-alpha.0",
            "26.6.0-alpha.13",
            "26.6.0-beta.1",
        ):
            with self.subTest(raw=raw):
                self.assertEqual(
                    python_build_utils._pep440_from_git_version("robot-stack", raw),
                    raw,
                )

    def test_calendar_internal_unchanged(self):
        for raw in (
            "26.5.2601",
            "26.5.2601-alpha",
            "26.5.2699-beta",
        ):
            with self.subTest(raw=raw):
                self.assertEqual(
                    python_build_utils._pep440_from_git_version(
                        "robot-stack-internal", raw
                    ),
                    raw,
                )

    def test_other_projects_unchanged(self):
        self.assertEqual(
            python_build_utils._pep440_from_git_version("docs", "1.2.3"),
            "1.2.3",
        )


if __name__ == "__main__":
    unittest.main()
