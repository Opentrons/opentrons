"""Tests for docs build-info tag parsing."""

import unittest

from generate_build_info import pick_latest_tag, parse_docs_tag, version_from_tag


class ParseDocsTagTest(unittest.TestCase):
    def test_parses_production_tag_with_v_prefix(self) -> None:
        parsed = parse_docs_tag("mkdocs-v2.1.0")
        assert parsed is not None
        self.assertEqual(parsed.prefix, "mkdocs-")
        self.assertEqual(str(parsed.version), "2.1.0")

    def test_parses_staging_tag(self) -> None:
        parsed = parse_docs_tag("staging-mkdocs-v2.1.0-alpha.1")
        assert parsed is not None
        self.assertEqual(parsed.prefix, "staging-mkdocs-")
        self.assertEqual(str(parsed.version), "2.1.0a1")

    def test_rejects_unrelated_tags(self) -> None:
        self.assertIsNone(parse_docs_tag("v9.1.2"))
        self.assertIsNone(parse_docs_tag("protocol-designer@8.6.0"))


class PickLatestTagTest(unittest.TestCase):
    def test_highest_version_wins(self) -> None:
        self.assertEqual(
            pick_latest_tag(["mkdocs-v2.0.0", "mkdocs-v2.1.0", "staging-mkdocs-v1.9.0"]),
            "mkdocs-v2.1.0",
        )

    def test_production_beats_staging_on_same_version(self) -> None:
        self.assertEqual(
            pick_latest_tag(["staging-mkdocs-v2.1.0", "mkdocs-v2.1.0"]),
            "mkdocs-v2.1.0",
        )

    def test_staging_prerelease_can_beat_older_production(self) -> None:
        self.assertEqual(
            pick_latest_tag(["mkdocs-v2.0.0", "staging-mkdocs-v2.1.0-alpha.1"]),
            "staging-mkdocs-v2.1.0-alpha.1",
        )

    def test_returns_none_when_empty(self) -> None:
        self.assertIsNone(pick_latest_tag([]))

    def test_version_from_tag_falls_back(self) -> None:
        self.assertEqual(version_from_tag(None), "0.0.0-dev")
        self.assertEqual(version_from_tag("mkdocs-v2.1.0"), "2.1.0")


if __name__ == "__main__":
    unittest.main()
