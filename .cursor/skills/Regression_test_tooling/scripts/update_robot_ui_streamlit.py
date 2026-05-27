#!/usr/bin/env python3
"""Serve update_robot_ui.html via Streamlit (clipboard works on localhost)."""

from __future__ import annotations

import sys
from pathlib import Path

import streamlit as st

_SCRIPTS = Path(__file__).resolve().parent
_HTML = _SCRIPTS / "update_robot_ui.html"
_UPDATE_ROBOT = _SCRIPTS / "update_robot.py"


def _running_inside_streamlit() -> bool:
    try:
        from streamlit.runtime.scriptrunner_utils.script_run_context import (
            get_script_run_ctx,
        )

        return get_script_run_ctx() is not None
    except Exception:
        return False


def main() -> None:
    st.set_page_config(page_title="Flex update — command helper", layout="centered")
    st.caption(
        f"Script directory: `{_SCRIPTS}` — "
        "set the **Script** field below to an absolute path if needed."
    )

    if not _HTML.is_file():
        st.error(f"Missing {_HTML}")
        return

    html = _HTML.read_text(encoding="utf-8")
    html = html.replace(
        'value="python3 update_robot.py"',
        f'value="python3 {_UPDATE_ROBOT}"',
        1,
    )

    st.components.v1.html(html, height=920, scrolling=True)


if _running_inside_streamlit():
    main()
else:
    print(
        "Run with:\n"
        f"  python3 -m streamlit run {Path(__file__).resolve()}",
        file=sys.stderr,
    )
    sys.exit(2)
