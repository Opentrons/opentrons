"""Test result directories, tracing, and artifact paths for pytest-html reports."""

from __future__ import annotations

import os
import re
from dataclasses import dataclass
from pathlib import Path

import pytest
from playwright.sync_api import BrowserContext, Page
from playwright.sync_api import Error as PlaywrightError

from automation.helpers.screencast_recorder import ScreencastRecorder

TEST_RESULTS_DIR = Path("test-results")
VIDEOS_DIR = TEST_RESULTS_DIR / "videos"
TRACES_DIR = TEST_RESULTS_DIR / "traces"
SCREENSHOTS_DIR = TEST_RESULTS_DIR / "screenshots"


def ensure_test_results_dir() -> None:
    """Create ``test-results/`` and artifact subdirectories if missing."""
    for directory in (TEST_RESULTS_DIR, VIDEOS_DIR, TRACES_DIR, SCREENSHOTS_DIR):
        directory.mkdir(parents=True, exist_ok=True)


def is_headed_run(config: pytest.Config) -> bool:
    """Return True when the Electron window should stay visible during tests."""
    if config.getoption("--headed", default=False):
        return True
    return os.environ.get("HEADED", "").strip().lower() in ("1", "true", "yes")


def slugify_nodeid(nodeid: str) -> str:
    """Convert a pytest node ID to a filesystem-friendly slug."""
    test_identifier = nodeid.split("::")[-1]
    candidate = re.sub(r"[^A-Za-z0-9_.-]+", "_", test_identifier)
    candidate = candidate.strip("_")
    if not candidate:
        return "test"
    return candidate[:200]


def unique_artifact_path(directory: Path, slug: str, suffix: str) -> Path:
    """Return ``directory/slug{suffix}``, appending ``_N`` when the path exists."""
    destination = directory / f"{slug}{suffix}"
    counter = 1
    while destination.exists():
        destination = directory / f"{slug}_{counter}{suffix}"
        counter += 1
    return destination


@dataclass
class TestArtifacts:
    """Paths produced for a single test run."""

    slug: str
    trace_path: Path | None = None
    video_path: Path | None = None
    screenshot_path: Path | None = None


@dataclass
class ActiveTestRecording:
    """In-flight per-test recording state."""

    slug: str
    trace_path: Path
    artifacts: TestArtifacts
    video_path: Path | None = None
    screencast: ScreencastRecorder | None = None
    tracing_started: bool = False


def start_test_recording(
    *,
    context: BrowserContext,
    page: Page,
    slug: str,
    record_screencast: bool,
) -> ActiveTestRecording:
    """Start Playwright tracing and optional CDP screencast for one test."""
    ensure_test_results_dir()
    trace_path = unique_artifact_path(TRACES_DIR, slug, ".zip")
    video_path = unique_artifact_path(VIDEOS_DIR, slug, ".webm") if record_screencast else None

    recording = ActiveTestRecording(
        slug=slug,
        trace_path=trace_path,
        video_path=video_path,
        artifacts=TestArtifacts(slug=slug, trace_path=trace_path, video_path=video_path),
    )

    try:
        context.tracing.start(screenshots=True, snapshots=True, sources=True)
        recording.tracing_started = True
    except PlaywrightError as error:
        print(f"\n⚠️  Unable to start tracing for {slug}: {error}")

    if record_screencast and video_path is not None:
        screencast = ScreencastRecorder(page, video_path)
        try:
            screencast.start()
            recording.screencast = screencast
        except PlaywrightError as error:
            print(f"\n⚠️  Unable to start screencast for {slug}: {error}")
            recording.video_path = None
            recording.artifacts.video_path = None

    return recording


def stop_test_recording(
    context: BrowserContext,
    recording: ActiveTestRecording,
) -> TestArtifacts:
    """Stop tracing and screencast, returning saved artifact paths."""
    artifacts = recording.artifacts

    if recording.screencast is not None:
        saved_video = recording.screencast.stop()
        if saved_video is None:
            artifacts.video_path = None
        else:
            artifacts.video_path = saved_video

    if recording.tracing_started:
        try:
            context.tracing.stop(path=str(recording.trace_path))
            artifacts.trace_path = recording.trace_path
        except PlaywrightError as error:
            print(f"\n⚠️  Unable to save trace for {recording.slug}: {error}")
            artifacts.trace_path = None

    return artifacts


def capture_failure_screenshot(page: Page, slug: str) -> Path | None:
    """Save a full-page screenshot when a test fails."""
    ensure_test_results_dir()
    screenshot_path = unique_artifact_path(SCREENSHOTS_DIR, slug, ".png")
    try:
        page.screenshot(path=str(screenshot_path), full_page=True)
        return screenshot_path
    except PlaywrightError as error:
        print(f"\n⚠️  Unable to save failure screenshot for {slug}: {error}")
        return None
