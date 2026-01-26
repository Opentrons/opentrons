"""Protocol export tooling for Protocol Designer migrations.

This module is intentionally **not** a pytest test.

Primary use: export all Protocol Designer protocol fixtures from a given
deployment (staging/prod), saving normalized `.py` files under a versioned
folder:

- Exports: e2e-testing/migration-report/<version>/exports/<fixtureKey>.py
- Manifest: e2e-testing/migration-report/<version>/exports_manifest.json

Run via:
- `make -C e2e-testing migration-export-staging`
- `make -C e2e-testing migration-export-prod`

Optional env:
- `MIGRATION_REPORT_KEYS`: comma-separated list of fixture keys to export
- `MIGRATION_REPORT_SINGLE_KEY`: single fixture key to export
- `MIGRATION_REPORT_CLEAN=true`: delete the version output folder first
- `MIGRATION_REPORT_LOG_MIGRATION_MODAL=true`: print migration modal timings
- `MIGRATION_REPORT_LOG_DOWNLOAD=true`: print download timings
"""

from __future__ import annotations

import json
import os
import re
import shutil
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from playwright.sync_api import Browser, Page, sync_playwright

from automation.pd_migration_pages import get_migration_actions
from automation.pd_pages.info_page import InfoPage
from protocols import ProtocolFixture, get_protocol_fixtures


@dataclass(frozen=True, slots=True)
class ExportResult:
    """Result of exporting a single fixture."""

    key: str
    fixture_path: str
    ok: bool
    exported_path: str | None
    error: str | None
    timings: dict[str, int | bool]


def _e2e_root() -> Path:
    # Resolve relative to this file so output does not depend on CWD.
    # This script lives at e2e-testing/migration_report.py.
    return Path(__file__).resolve().parent


def _report_root() -> Path:
    return _e2e_root() / "migration-report"


def _slugify_version(version: str) -> str:
    candidate = version.strip()
    if not candidate:
        return "unknown"
    candidate = re.sub(r"[^A-Za-z0-9_.-]+", "_", candidate)
    candidate = candidate.strip("_")
    return candidate or "unknown"


def _version_root(version: str) -> Path:
    return _report_root() / _slugify_version(version)


def _exports_dir(version_root: Path) -> Path:
    return version_root / "exports"


def _artifacts_dir(version_root: Path) -> Path:
    return version_root / "artifacts"


def _ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def _ui_timeout_ms() -> int:
    return int(os.environ.get("MIGRATION_REPORT_UI_TIMEOUT_MS", "3000"))


def _download_timeout_ms() -> int:
    return int(os.environ.get("MIGRATION_REPORT_DOWNLOAD_TIMEOUT_MS", "15000"))


def _get_app_version(browser: Browser, base_url: str) -> str:
    """Load `/info` and return the displayed version string."""

    url = base_url.rstrip("/") + "/info"
    context = browser.new_context(viewport={"width": 1280, "height": 720})
    page = context.new_page()
    page.set_default_timeout(_ui_timeout_ms())
    try:
        page.goto(url)
        return InfoPage(page).get_version()
    finally:
        page.close()
        context.close()


def _stable_export_destination(output_dir: Path, fixture_key: str) -> Path:
    return output_dir / f"{fixture_key}.py"


def _p95(values: list[int]) -> float:
    if not values:
        return 0.0
    values_sorted = sorted(values)
    idx = int(round(0.95 * (len(values_sorted) - 1)))
    return float(values_sorted[idx])


def _export_one(page: Page, base_url: str, version: str, fixture: ProtocolFixture, output_dir: Path) -> ExportResult:
    timings: dict[str, int | bool] = {}

    total_start = time.perf_counter()
    try:
        start = time.perf_counter()
        page.goto(base_url)
        timings["goto_ms"] = int((time.perf_counter() - start) * 1000)

        actions = get_migration_actions(version, page)

        start = time.perf_counter()
        actions.import_protocol_from_landing(fixture.path)
        timings["import_ms"] = int((time.perf_counter() - start) * 1000)

        try:
            for key, value in actions.get_last_import_diagnostics().items():
                timings[f"import_{key}"] = value
        except Exception:
            pass

        start = time.perf_counter()
        actions.wait_for_protocol_loaded()
        timings["wait_loaded_ms"] = int((time.perf_counter() - start) * 1000)

        destination = _stable_export_destination(output_dir, fixture.key)
        _ensure_dir(output_dir)
        if destination.exists():
            destination.unlink()

        start = time.perf_counter()
        exported = actions.export_protocol(destination)
        timings["export_download_ms"] = int((time.perf_counter() - start) * 1000)

        try:
            for export_key, export_value in actions.get_last_export_diagnostics().items():
                if isinstance(export_value, str):
                    continue
                timings[f"export_{export_key}"] = export_value
        except Exception:
            pass

        timings["total_ms"] = int((time.perf_counter() - total_start) * 1000)
        return ExportResult(
            key=fixture.key,
            fixture_path=str(fixture.path),
            ok=True,
            exported_path=str(exported.download_path),
            error=None,
            timings=timings,
        )
    except Exception as e:
        timings["total_ms"] = int((time.perf_counter() - total_start) * 1000)
        return ExportResult(
            key=fixture.key,
            fixture_path=str(fixture.path),
            ok=False,
            exported_path=None,
            error=str(e),
            timings=timings,
        )


def _select_fixtures(all_fixtures: list[ProtocolFixture]) -> list[ProtocolFixture]:
    by_key = {f.key: f for f in all_fixtures}

    single = (os.environ.get("MIGRATION_REPORT_SINGLE_KEY", "") or "").strip()
    keys_raw = (os.environ.get("MIGRATION_REPORT_KEYS", "") or "").strip()

    if single:
        if single not in by_key:
            raise RuntimeError(f"Unknown fixture key: {single}")
        return [by_key[single]]

    if keys_raw:
        keys = [k.strip() for k in keys_raw.split(",") if k.strip()]
        unknown = [k for k in keys if k not in by_key]
        if unknown:
            raise RuntimeError(f"Unknown fixture key(s): {', '.join(unknown)}")
        return [by_key[k] for k in keys]

    return all_fixtures


def main() -> None:
    base_url = os.environ.get("MIGRATION_REPORT_BASE_URL", "https://designer.opentrons.com").strip()
    headless = os.environ.get("MIGRATION_REPORT_HEADLESS", "true").lower() == "true"
    clean = os.environ.get("MIGRATION_REPORT_CLEAN", "false").lower() == "true"

    print("Starting migration export run")
    print(f"- Base URL: {base_url}")

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=headless)
        try:
            version = _get_app_version(browser, base_url)
            print(f"- App version: {version}")

            os.environ["MIGRATION_REPORT_APP_VERSION"] = version

            version_root = _version_root(version)
            if clean and version_root.exists():
                shutil.rmtree(version_root)

            exports_dir = _exports_dir(version_root)
            artifacts_dir = _artifacts_dir(version_root)
            _ensure_dir(exports_dir)
            _ensure_dir(artifacts_dir)

            # Used by migration page objects to capture screenshots/html on timeouts.
            os.environ["MIGRATION_REPORT_ARTIFACTS_DIR"] = str(artifacts_dir)

            all_fixtures = get_protocol_fixtures()
            fixtures = _select_fixtures(all_fixtures)

            context = browser.new_context(viewport={"width": 1280, "height": 720}, accept_downloads=True)
            results: list[ExportResult] = []
            failures: list[ExportResult] = []

            try:
                for index, fixture in enumerate(fixtures, start=1):
                    print(f"[{version}] ({index}/{len(fixtures)}) exporting {fixture.key}")
                    page = context.new_page()
                    page.set_default_timeout(_ui_timeout_ms())
                    try:
                        result = _export_one(page, base_url, version, fixture, exports_dir)
                        results.append(result)
                        if not result.ok:
                            failures.append(result)
                    finally:
                        page.close()
            finally:
                context.close()

            manifest: dict[str, Any] = {
                "base_url": base_url,
                "version": version,
                "ui_timeout_ms": _ui_timeout_ms(),
                "download_timeout_ms": _download_timeout_ms(),
                "exports_dir": str(exports_dir),
                "artifacts_dir": str(artifacts_dir),
                "results": [asdict(r) for r in results],
                "failures": [r.key for r in failures],
            }

            # Aggregates
            modal_waits = [
                int(r.timings.get("import_migration_modal_wait_ms", 0))
                for r in results
                if isinstance(r.timings.get("import_migration_modal_wait_ms", 0), int)
            ]
            modal_shown = sum(1 for r in results if bool(r.timings.get("import_migration_modal_shown", False)))
            export_waits = [
                int(r.timings.get("export_download_wait_ms", 0))
                for r in results
                if isinstance(r.timings.get("export_download_wait_ms", 0), int)
            ]

            manifest["summary"] = {
                "count": len(results),
                "failures": len(failures),
                "migration_modal": {
                    "shown": modal_shown,
                    "not_shown": len(results) - modal_shown,
                    "avg_wait_ms": (sum(modal_waits) / len(modal_waits)) if modal_waits else 0.0,
                },
                "export_download_wait_ms_p95": _p95(export_waits),
            }

            (version_root / "exports_manifest.json").write_text(
                json.dumps(manifest, indent=2, sort_keys=True),
                encoding="utf-8",
            )

            print("Migration export complete")
            print(f"- Failures: {len(failures)}")
            print(f"- Exports:  {exports_dir}")

            # Keep a small, high-signal summary consistent with logging toggles.
            print(
                "- Migration modal: shown=%s not_shown=%s avg_wait_ms=%s"
                % (
                    manifest["summary"]["migration_modal"]["shown"],
                    manifest["summary"]["migration_modal"]["not_shown"],
                    manifest["summary"]["migration_modal"]["avg_wait_ms"],
                )
            )
            print("- Export download wait p95 (ms): %s" % (manifest["summary"]["export_download_wait_ms_p95"],))

            if failures:
                print("- Failed keys:")
                for r in failures:
                    print(f"  - {r.key}: {r.error}")
        finally:
            browser.close()


if __name__ == "__main__":
    main()
