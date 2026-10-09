"""ABR2/ABR4 orchestration: start protocols on DVT1ABR2 and DVT1ABR4."""

from __future__ import annotations

from pathlib import Path

import pytest
from playwright.sync_api import Page

from automation.app_helpers.protocol_run_target import ProtocolRunTarget
from automation.app_helpers.test_progress import log_done, log_step
from automation.app_pages import (
    ChooseRobotToRunProtocolSlideout,
    ProtocolRunPage,
    ProtocolsPage,
)

ABR2 = ProtocolRunTarget(
    protocol_name="PCR Protocol with TC Auto Sealing Lid ABR OFF",
    robot_name="DVT1ABR2",
    csv_path=Path(__file__).parent / "2_samplevols.csv",
)

ABR4 = ProtocolRunTarget(
    protocol_name="ABR OFF Illumina DNA Enrichment v4 with TC Auto Sealing Lid",
    robot_name="DVT1ABR4",
)


def _start_run_for_target(page: Page, target: ProtocolRunTarget) -> None:
    """Start setup, create the run, wait for analysis, and click Start run."""
    log_step(f"Start setup for '{target.protocol_name}'")
    ProtocolsPage(page).start_setup(target.protocol_name)
    log_done("Start setup slideout opened")

    log_step(f"Select robot '{target.robot_name}', set parameters, confirm values")
    ChooseRobotToRunProtocolSlideout(page).start_run(target)
    log_done("Run created from confirmed parameters")

    run_page = ProtocolRunPage(page)
    log_step("Wait for Analyzing on robot to finish")
    run_page.wait_until_analysis_complete()
    log_done("Analysis complete")

    log_step("Click Start run")
    run_page.click_start_run()
    log_done("Start run clicked")


@pytest.mark.timeout(900)
def test_abr_2_start_run(run_local_app: Page) -> None:
    """Start setup for ABR2 PCR protocol, upload CSV, and click Start run."""
    _start_run_for_target(run_local_app, ABR2)


@pytest.mark.timeout(900)
def test_abr_4_start_run(run_local_app: Page) -> None:
    """Start setup for ABR4 Illumina DNA Enrichment (no CSV) and click Start run."""
    _start_run_for_target(run_local_app, ABR4)
