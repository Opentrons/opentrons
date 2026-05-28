"""OT-2 calendar semver tag parsing for build and CI.

Internal (internal@): YY.M.DNN with optional -alpha or -beta (day in patch).
External (v): YY.M.N with N in 0-9, optional -alpha.N or -beta.N prereleases.

Calendar components use US Eastern (America/New_York).

Build/CI gate: OT2_*_TAG_RE plus version_from_internal_tag / version_from_external_tag
(in python_build_utils and git-version.mjs). Only calendar tags that pass those helpers
reach wheel versioning.
"""

from __future__ import annotations

import re
from typing import Optional

OT2_MONTH = r"(?:[1-9]|1[0-2])"
OT2_MONTH_CAP = r"([1-9]|1[0-2])"

# Internal: patch is DNN (>= 101), optional bare -alpha / -beta
OT2_INTERNAL_TAG_RE = re.compile(
    rf"^internal@((\d{{2}})\.{OT2_MONTH_CAP}\.(\d+)(?:-(alpha|beta))?)$"
)

# External: patch N is 0-9, prerelease is -alpha.N or -beta.N
OT2_EXTERNAL_TAG_RE = re.compile(
    rf"^v((\d{{2}})\.{OT2_MONTH_CAP}\.([0-9])(?:-(alpha|beta)\.(\d+))?)$"
)


def version_from_internal_tag(tag: str) -> Optional[str]:
    """Return the semver tail from an internal@ tag, or None if not internal calendar semver."""
    match = OT2_INTERNAL_TAG_RE.match(tag)
    if match is None:
        return None
    return match.group(1)


def version_from_external_tag(tag: str) -> Optional[str]:
    """Return the semver tail from a v tag, or None if not external calendar semver."""
    match = OT2_EXTERNAL_TAG_RE.match(tag)
    if match is None:
        return None
    return match.group(1)
