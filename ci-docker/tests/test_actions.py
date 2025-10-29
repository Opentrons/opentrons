"""Tests for GitHub Actions utility helpers."""

from __future__ import annotations

import json
from pathlib import Path
from typing import TYPE_CHECKING

import pytest

from ci_docker.utils.actions import (
    ContainerTagResult,
    SourceRefResult,
    determine_container_tag,
    determine_source_ref,
)

if TYPE_CHECKING:
    from collections.abc import Iterator


@pytest.fixture
def temp_repo(tmp_path: Path) -> Iterator[Path]:
    """Create a temporary repository structure with dependency files."""
    # Create Python dependency files
    (tmp_path / "api").mkdir()
    (tmp_path / "api" / "Pipfile").write_text("[[source]]\nurl = 'https://pypi.org/simple'\n")
    (tmp_path / "api" / "Pipfile.lock").write_text('{"_meta": {}}')

    # Create JS dependency files
    (tmp_path / "app").mkdir()
    (tmp_path / "app" / "package.json").write_text('{"name": "app", "version": "1.0.0"}')
    (tmp_path / "app" / "yarn.lock").write_text("# yarn lockfile v1\n")

    # Create Dockerfile
    (tmp_path / "ci-docker").mkdir()
    (tmp_path / "ci-docker" / "Dockerfile").write_text("FROM ubuntu:22.04\n")

    yield tmp_path


class TestDetermineSourceRef:
    """Tests for determine_source_ref function."""

    def test_empty_ref_uses_default_branch(self) -> None:
        """Test that empty ref falls back to default branch."""
        result = determine_source_ref(ref=None, default_branch="edge")
        assert result.ref == "refs/heads/edge"
        assert result.ref_name == "edge"
        assert "defaulting to edge" in result.reason.lower()

    def test_empty_string_ref_uses_default_branch(self) -> None:
        """Test that empty string ref falls back to default branch."""
        result = determine_source_ref(ref="", default_branch="main")
        assert result.ref == "refs/heads/main"
        assert result.ref_name == "main"

    def test_refs_heads_only_uses_default_branch(self) -> None:
        """Test that 'refs/heads/' with no branch falls back to default."""
        result = determine_source_ref(ref="refs/heads/", default_branch="edge")
        assert result.ref == "refs/heads/edge"
        assert result.ref_name == "edge"

    def test_valid_branch_ref_extracts_name(self) -> None:
        """Test that valid branch ref extracts the branch name."""
        result = determine_source_ref(ref="refs/heads/my-feature", default_branch="edge")
        assert result.ref == "refs/heads/my-feature"
        assert result.ref_name == "my-feature"
        assert "using event ref" in result.reason.lower()

    def test_nested_branch_name_extracts_correctly(self) -> None:
        """Test that nested branch names are extracted correctly."""
        result = determine_source_ref(ref="refs/heads/chore/update-deps", default_branch="edge")
        assert result.ref == "refs/heads/chore/update-deps"
        assert result.ref_name == "chore/update-deps"

    def test_non_branch_ref_returns_as_is(self) -> None:
        """Test that non-branch refs return the ref as both ref and ref_name."""
        result = determine_source_ref(ref="v1.0.0", default_branch="edge")
        assert result.ref == "v1.0.0"
        assert result.ref_name == "v1.0.0"


class TestDetermineContainerTag:
    """Tests for determine_container_tag function."""

    def test_pull_request_to_edge_uses_default(self) -> None:
        """Test that PR to edge uses default tag."""
        result = determine_container_tag(
            event_name="pull_request",
            base_ref="edge",
            ref_name=None,
            default_tag="edge",
            release_prefix="chore_release",
        )
        assert result.tag == "edge"
        assert "defaulting" in result.reason.lower()

    def test_pull_request_to_release_branch_uses_branch_tag(self) -> None:
        """Test that PR to release branch uses branch-specific tag."""
        result = determine_container_tag(
            event_name="pull_request",
            base_ref="chore_release-8.0.0",
            ref_name=None,
            default_tag="edge",
            release_prefix="chore_release",
        )
        assert result.tag == "branch-chore_release-8.0.0"
        assert "matches release prefix" in result.reason.lower()

    def test_pull_request_to_nested_release_branch_sanitizes(self) -> None:
        """Test that PR to nested release branch sanitizes slashes."""
        result = determine_container_tag(
            event_name="pull_request",
            base_ref="chore_release/8.0.0",
            ref_name=None,
            default_tag="edge",
            release_prefix="chore_release",
        )
        assert result.tag == "branch-chore_release-8.0.0"
        assert "/" not in result.tag

    def test_push_to_release_branch_uses_branch_tag(self) -> None:
        """Test that push to release branch uses branch-specific tag."""
        result = determine_container_tag(
            event_name="push",
            base_ref=None,
            ref_name="chore_release-9.1.2",
            default_tag="edge",
            release_prefix="chore_release",
        )
        assert result.tag == "branch-chore_release-9.1.2"
        assert "matches release prefix" in result.reason.lower()

    def test_push_to_non_release_branch_uses_default(self) -> None:
        """Test that push to non-release branch uses default tag."""
        result = determine_container_tag(
            event_name="push",
            base_ref=None,
            ref_name="feature/new-thing",
            default_tag="edge",
            release_prefix="chore_release",
        )
        assert result.tag == "edge"
        assert "defaulting" in result.reason.lower()

    def test_workflow_dispatch_uses_default(self) -> None:
        """Test that workflow_dispatch uses default tag."""
        result = determine_container_tag(
            event_name="workflow_dispatch",
            base_ref=None,
            ref_name="edge",
            default_tag="edge",
            release_prefix="chore_release",
        )
        assert result.tag == "edge"

    def test_empty_values_use_default(self) -> None:
        """Test that empty/None values use default tag."""
        result = determine_container_tag(
            event_name="",
            base_ref=None,
            ref_name=None,
            default_tag="fallback",
            release_prefix="chore_release",
        )
        assert result.tag == "fallback"

    def test_custom_release_prefix(self) -> None:
        """Test that custom release prefix works correctly."""
        result = determine_container_tag(
            event_name="pull_request",
            base_ref="release-v1.0",
            ref_name=None,
            default_tag="main",
            release_prefix="release",
        )
        assert result.tag == "branch-release-v1.0"


class TestDependencyChecksums:
    """Tests for dependency checksum computation."""

    def test_compute_checksums_includes_all_file_types(self, temp_repo: Path) -> None:
        """Test that checksums are computed for Python, JS, and Dockerfile."""
        from ci_docker.utils.actions import _compute_dependency_checksums

        result = _compute_dependency_checksums(temp_repo)

        assert "python" in result
        assert "javascript" in result
        assert "dockerfile" in result

        # Verify structure
        assert "checksum" in result["python"]
        assert "files" in result["python"]
        assert "checksum" in result["javascript"]
        assert "files" in result["javascript"]
        assert "checksum" in result["dockerfile"]
        assert "path" in result["dockerfile"]

    def test_python_files_collected_correctly(self, temp_repo: Path) -> None:
        """Test that Python dependency files are collected."""
        from ci_docker.utils.actions import _compute_dependency_checksums

        result = _compute_dependency_checksums(temp_repo)
        python_files = result["python"]["files"]

        assert any("Pipfile" in str(f) and "Pipfile.lock" not in str(f) for f in python_files)
        assert any("Pipfile.lock" in str(f) for f in python_files)

    def test_javascript_files_collected_correctly(self, temp_repo: Path) -> None:
        """Test that JavaScript dependency files are collected."""
        from ci_docker.utils.actions import _compute_dependency_checksums

        result = _compute_dependency_checksums(temp_repo)
        js_files = result["javascript"]["files"]

        assert any("package.json" in str(f) for f in js_files)
        assert any("yarn.lock" in str(f) for f in js_files)

    def test_dockerfile_path_included(self, temp_repo: Path) -> None:
        """Test that Dockerfile path is included in checksums."""
        from ci_docker.utils.actions import _compute_dependency_checksums

        result = _compute_dependency_checksums(temp_repo)

        assert result["dockerfile"]["path"] == "ci-docker/Dockerfile"
        assert result["dockerfile"]["checksum"] != ""

    def test_missing_dockerfile_returns_empty_checksum(self, tmp_path: Path) -> None:
        """Test that missing Dockerfile returns empty checksum."""
        from ci_docker.utils.actions import _compute_dependency_checksums

        result = _compute_dependency_checksums(tmp_path)

        assert result["dockerfile"]["checksum"] == ""
        assert result["dockerfile"]["path"] == "ci-docker/Dockerfile"

    def test_checksum_changes_when_content_changes(self, temp_repo: Path) -> None:
        """Test that checksums change when file content changes."""
        from ci_docker.utils.actions import _compute_dependency_checksums

        # Get initial checksums
        initial = _compute_dependency_checksums(temp_repo)
        initial_python_checksum = initial["python"]["checksum"]

        # Modify a Python file
        (temp_repo / "api" / "Pipfile").write_text("[[source]]\nurl = 'https://example.com'\n")

        # Get new checksums
        updated = _compute_dependency_checksums(temp_repo)
        updated_python_checksum = updated["python"]["checksum"]

        assert initial_python_checksum != updated_python_checksum

    def test_node_modules_excluded(self, temp_repo: Path) -> None:
        """Test that node_modules directories are excluded."""
        from ci_docker.utils.actions import _compute_dependency_checksums

        # Create a package.json inside node_modules
        node_modules = temp_repo / "app" / "node_modules" / "some-package"
        node_modules.mkdir(parents=True)
        (node_modules / "package.json").write_text('{"name": "excluded"}')

        result = _compute_dependency_checksums(temp_repo)
        js_files = result["javascript"]["files"]

        # Should not include the node_modules package.json
        assert not any("node_modules" in str(f) for f in js_files)

    def test_venv_excluded(self, temp_repo: Path) -> None:
        """Test that .venv directories are excluded."""
        from ci_docker.utils.actions import _compute_dependency_checksums

        # Create a Pipfile inside .venv
        venv = temp_repo / ".venv" / "lib" / "python3.10" / "site-packages"
        venv.mkdir(parents=True)
        (venv / "Pipfile").write_text("excluded")

        result = _compute_dependency_checksums(temp_repo)
        python_files = result["python"]["files"]

        # Should not include the .venv Pipfile
        assert not any(".venv" in str(f) for f in python_files)

    def test_directory_entries_skipped(self, temp_repo: Path) -> None:
        """Test that directory entries are skipped during file collection."""
        from ci_docker.utils.actions import _compute_dependency_checksums

        # Create a directory with the same name as a file pattern (edge case)
        weird_dir = temp_repo / "Pipfile"
        weird_dir.mkdir()

        # Should not crash and should skip the directory
        result = _compute_dependency_checksums(temp_repo)
        assert "python" in result

    def test_duplicate_files_deduplicated(self, temp_repo: Path) -> None:
        """Test that duplicate relative paths are deduplicated."""
        from ci_docker.utils.actions import _collect_dependency_files

        # Create multiple files that match the pattern
        subdir1 = temp_repo / "sub1"
        subdir2 = temp_repo / "sub2"
        subdir1.mkdir()
        subdir2.mkdir()

        (subdir1 / "Pipfile").write_text("content1")
        (subdir2 / "Pipfile").write_text("content2")

        # Collect all Pipfiles
        files = _collect_dependency_files(temp_repo, ["**/Pipfile"])

        # Should find all files without duplicates
        assert len(files) >= 3  # api/Pipfile, sub1/Pipfile, sub2/Pipfile
        # Verify no duplicate paths
        relative_paths = [f.relative_to(temp_repo).as_posix() for f in files]
        assert len(relative_paths) == len(set(relative_paths))


class TestBaselineComparison:
    """Tests for baseline comparison logic."""

    def test_load_baseline_missing_file_returns_none(self, tmp_path: Path) -> None:
        """Test that loading missing baseline returns None."""
        from ci_docker.utils.actions import _load_baseline

        result = _load_baseline(tmp_path / "nonexistent.json")
        assert result is None

    def test_load_baseline_valid_file(self, tmp_path: Path) -> None:
        """Test that loading valid baseline works."""
        from ci_docker.utils.actions import _load_baseline

        baseline_file = tmp_path / "baseline.json"
        baseline_data = {
            "python": {"checksum": "abc123", "files": []},
            "javascript": {"checksum": "def456", "files": []},
        }
        baseline_file.write_text(json.dumps(baseline_data))

        result = _load_baseline(baseline_file)
        assert result is not None
        assert result["python"]["checksum"] == "abc123"
        assert result["javascript"]["checksum"] == "def456"


class TestSanitization:
    """Tests for branch name sanitization."""

    def test_sanitize_replaces_slashes(self) -> None:
        """Test that slashes are replaced with dashes."""
        result = determine_container_tag(
            event_name="pull_request",
            base_ref="chore_release/8.0.0",
            ref_name=None,
            default_tag="edge",
            release_prefix="chore_release",
        )
        assert result.tag == "branch-chore_release-8.0.0"
        assert "/" not in result.tag

    def test_sanitize_multiple_slashes(self) -> None:
        """Test that multiple slashes are all replaced."""
        result = determine_container_tag(
            event_name="pull_request",
            base_ref="feature/team/new-thing",
            ref_name=None,
            default_tag="edge",
            release_prefix="feature",
        )
        assert result.tag == "branch-feature-team-new-thing"
        assert "/" not in result.tag


class TestDataclasses:
    """Tests for dataclass structures."""

    def test_source_ref_result_structure(self) -> None:
        """Test SourceRefResult dataclass structure."""
        result = SourceRefResult(ref="refs/heads/main", ref_name="main", reason="test")
        assert result.ref == "refs/heads/main"
        assert result.ref_name == "main"
        assert result.reason == "test"

    def test_container_tag_result_structure(self) -> None:
        """Test ContainerTagResult dataclass structure."""
        result = ContainerTagResult(tag="edge", reason="default")
        assert result.tag == "edge"
        assert result.reason == "default"


class TestCLIIntegration:
    """Tests for CLI argument parsing and execution."""

    def test_determine_source_ref_cli(self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test determine-source-ref CLI command."""
        from ci_docker.utils.actions import main

        output_file = tmp_path / "output.txt"
        monkeypatch.setenv("GITHUB_OUTPUT", str(output_file))

        argv = [
            "determine-source-ref",
            "--ref",
            "refs/heads/feature",
            "--default-branch",
            "edge",
            "--title",
            "Test Source Ref",
        ]

        result = main(argv)
        assert result == 0

        # Verify outputs were written
        assert output_file.exists()
        content = output_file.read_text()
        assert "ref=refs/heads/feature" in content
        assert "ref_name=feature" in content

    def test_determine_container_tag_cli(self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test determine-container-tag CLI command."""
        from ci_docker.utils.actions import main

        output_file = tmp_path / "output.txt"
        monkeypatch.setenv("GITHUB_OUTPUT", str(output_file))

        argv = [
            "determine-container-tag",
            "--event-name",
            "pull_request",
            "--base-ref",
            "edge",
            "--default-tag",
            "edge",
            "--release-prefix",
            "chore_release",
        ]

        result = main(argv)
        assert result == 0

        # Verify outputs were written
        assert output_file.exists()
        content = output_file.read_text()
        assert "tag=edge" in content

    def test_dependency_checksums_cli_no_baseline(
        self, temp_repo: Path, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Test dependency-checksums CLI command without baseline."""
        from ci_docker.utils.actions import main

        output_file = tmp_path / "output.txt"
        checksums_file = tmp_path / "checksums.json"
        monkeypatch.setenv("GITHUB_OUTPUT", str(output_file))

        argv = [
            "dependency-checksums",
            "--root",
            str(temp_repo),
            "--output",
            str(checksums_file),
            "--title",
            "Test Checksums",
        ]

        result = main(argv)
        assert result == 0

        # Verify checksums file was created
        assert checksums_file.exists()
        data = json.loads(checksums_file.read_text())
        assert "python" in data
        assert "javascript" in data
        assert "dockerfile" in data

        # Verify outputs show no changes
        assert output_file.exists()
        content = output_file.read_text()
        assert "dependencies_changed=false" in content

    def test_dependency_checksums_cli_with_matching_baseline(
        self, temp_repo: Path, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Test dependency-checksums CLI with matching baseline."""
        from ci_docker.utils.actions import _compute_dependency_checksums, main

        # Create baseline
        baseline_data = _compute_dependency_checksums(temp_repo)
        baseline_file = tmp_path / "baseline.json"
        baseline_file.write_text(json.dumps(baseline_data))

        output_file = tmp_path / "output.txt"
        monkeypatch.setenv("GITHUB_OUTPUT", str(output_file))

        argv = [
            "dependency-checksums",
            "--root",
            str(temp_repo),
            "--baseline",
            str(baseline_file),
        ]

        result = main(argv)
        assert result == 0

        # Verify no changes detected
        content = output_file.read_text()
        assert "dependencies_changed=false" in content
        assert "python_changed=false" in content
        assert "javascript_changed=false" in content

    def test_dependency_checksums_cli_with_changed_baseline(
        self, temp_repo: Path, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Test dependency-checksums CLI with changed baseline."""
        from ci_docker.utils.actions import main

        # Create baseline with different checksums
        baseline_data = {
            "python": {"checksum": "old-python-checksum", "files": []},
            "javascript": {"checksum": "old-js-checksum", "files": []},
            "dockerfile": {"checksum": "old-dockerfile-checksum", "path": "ci-docker/Dockerfile"},
        }
        baseline_file = tmp_path / "baseline.json"
        baseline_file.write_text(json.dumps(baseline_data))

        output_file = tmp_path / "output.txt"
        monkeypatch.setenv("GITHUB_OUTPUT", str(output_file))

        argv = [
            "dependency-checksums",
            "--root",
            str(temp_repo),
            "--baseline",
            str(baseline_file),
        ]

        result = main(argv)
        assert result == 0

        # Verify changes detected
        content = output_file.read_text()
        assert "dependencies_changed=true" in content
        assert "python_changed=true" in content
        assert "javascript_changed=true" in content
        assert "dockerfile_changed=true" in content

    def test_dependency_checksums_cli_with_missing_baseline(
        self, temp_repo: Path, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Test dependency-checksums CLI with missing baseline file."""
        from ci_docker.utils.actions import main

        output_file = tmp_path / "output.txt"
        monkeypatch.setenv("GITHUB_OUTPUT", str(output_file))

        argv = [
            "dependency-checksums",
            "--root",
            str(temp_repo),
            "--baseline",
            str(tmp_path / "nonexistent.json"),
        ]

        result = main(argv)
        assert result == 0

        # Verify changes detected due to missing baseline
        content = output_file.read_text()
        assert "dependencies_changed=true" in content

    def test_dependency_checksums_cli_fail_on_change(
        self, temp_repo: Path, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Test dependency-checksums CLI with --fail-on-change flag."""
        from ci_docker.utils.actions import main

        # Create baseline with different checksums
        baseline_data = {
            "python": {"checksum": "old-checksum", "files": []},
            "javascript": {"checksum": "old-checksum", "files": []},
            "dockerfile": {"checksum": "", "path": "ci-docker/Dockerfile"},
        }
        baseline_file = tmp_path / "baseline.json"
        baseline_file.write_text(json.dumps(baseline_data))

        output_file = tmp_path / "output.txt"
        monkeypatch.setenv("GITHUB_OUTPUT", str(output_file))

        argv = [
            "dependency-checksums",
            "--root",
            str(temp_repo),
            "--baseline",
            str(baseline_file),
            "--fail-on-change",
        ]

        # Should exit with non-zero status
        with pytest.raises(SystemExit) as exc_info:
            main(argv)
        assert exc_info.value.code == 1


class TestGitHubActions:
    """Tests for GitHub Actions integration functions."""

    def test_write_outputs(self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test _write_outputs function."""
        from ci_docker.utils.actions import _write_outputs

        output_file = tmp_path / "output.txt"
        monkeypatch.setenv("GITHUB_OUTPUT", str(output_file))

        _write_outputs({"key1": "value1", "key2": "value2"})

        content = output_file.read_text()
        assert "key1=value1" in content
        assert "key2=value2" in content

    def test_write_outputs_no_env_var(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test _write_outputs when GITHUB_OUTPUT is not set."""
        from ci_docker.utils.actions import _write_outputs

        monkeypatch.delenv("GITHUB_OUTPUT", raising=False)

        # Should not raise an error
        _write_outputs({"key": "value"})

    def test_append_summary(self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test _append_summary function."""
        from ci_docker.utils.actions import _append_summary

        summary_file = tmp_path / "summary.md"
        monkeypatch.setenv("GITHUB_STEP_SUMMARY", str(summary_file))

        rows = [("Key1", "Value1"), ("Key2", "Value2")]
        notes = ["Note 1", "Note 2"]

        _append_summary("Test Title", rows, notes)

        content = summary_file.read_text()
        assert "## Test Title" in content
        assert "| Key1 | `Value1` |" in content
        assert "| Key2 | `Value2` |" in content
        assert "Note 1" in content
        assert "Note 2" in content

    def test_append_summary_no_notes(self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test _append_summary without notes."""
        from ci_docker.utils.actions import _append_summary

        summary_file = tmp_path / "summary.md"
        monkeypatch.setenv("GITHUB_STEP_SUMMARY", str(summary_file))

        rows = [("Key", "Value")]
        _append_summary("Test", rows, None)

        content = summary_file.read_text()
        assert "## Test" in content
        assert "| Key | `Value` |" in content

    def test_append_summary_no_env_var(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test _append_summary when GITHUB_STEP_SUMMARY is not set."""
        from ci_docker.utils.actions import _append_summary

        monkeypatch.delenv("GITHUB_STEP_SUMMARY", raising=False)

        # Should not raise an error
        _append_summary("Test", [("Key", "Value")], None)

    def test_print_table(self) -> None:
        """Test _print_table function renders without errors."""
        from ci_docker.utils.actions import _print_table

        # Should not raise an error
        _print_table("Test Table", [("Key1", "Value1"), ("Key2", "Value2")])


class TestMainEntry:
    """Tests for main entry point."""

    def test_main_entry_point(self, tmp_path: Path) -> None:
        """Test that __main__ block works correctly."""
        import os
        import subprocess
        import sys

        # Get the path to the actions.py file
        actions_file = Path(__file__).parent.parent / "ci_docker" / "utils" / "actions.py"

        output_file = tmp_path / "output.txt"

        # Run the script directly as __main__
        env = os.environ.copy()
        env["GITHUB_OUTPUT"] = str(output_file)

        result = subprocess.run(
            [
                sys.executable,
                str(actions_file),
                "determine-source-ref",
                "--ref",
                "refs/heads/test",
                "--default-branch",
                "edge",
            ],
            capture_output=True,
            text=True,
            env=env,
        )

        assert result.returncode == 0
