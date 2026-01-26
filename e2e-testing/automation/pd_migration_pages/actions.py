"""Interfaces for versioned migration actions."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

from playwright.sync_api import Page


@dataclass(frozen=True, slots=True)
class ExportedProtocol:
    """A downloaded exported protocol artifact."""

    download_path: Path


class MigrationActions(Protocol):
    """Actions needed by the migration report runner."""

    page: Page

    def import_protocol_from_landing(self, protocol_path: Path) -> None:
        """Import a protocol file from the landing page."""

    def wait_for_protocol_loaded(self) -> None:
        """Wait until the protocol is fully loaded in the editor view."""

    def export_protocol(self, destination: Path) -> ExportedProtocol:
        """Export the current protocol and save it to the given destination path."""

    def get_last_import_diagnostics(self) -> dict[str, int | bool]:
        """Return diagnostics captured during the most recent import step."""

    def get_last_export_diagnostics(self) -> dict[str, int | bool | str]:
        """Return diagnostics captured during the most recent export step."""
