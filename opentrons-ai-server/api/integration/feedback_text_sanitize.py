"""Sanitize user feedback before it is stored in Google Sheets.

HTML markup and script content are stripped with ``nh3`` (Rust ammonia bindings),
which is maintained for safe HTML cleaning and avoids hand-rolled regex for tags,
attributes, and ``javascript:`` URLs inside HTML.

Spreadsheet formula injection is handled separately by removing a leading ``=``,
since that is not an HTML concern.
"""

from __future__ import annotations

import html
import re

import nh3

# Prevent user input from being interpreted as a Sheets formula (e.g. =IMPORTRANGE(...)).
_FORMULA_PREFIX = re.compile(r"^\s*=\s*")

# Strip all HTML; feedback is stored and displayed as plain text.
_NO_HTML_TAGS: set[str] = set()


def sanitize_feedback_for_google_sheets(input_text: str) -> str:
    """Return plain text safe to append as a cell value."""
    decoded = html.unescape(input_text)
    without_html = nh3.clean(decoded, tags=_NO_HTML_TAGS)
    without_formula = _FORMULA_PREFIX.sub("", without_html)
    return without_formula.strip()
