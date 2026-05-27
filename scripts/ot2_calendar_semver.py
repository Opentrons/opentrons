"""OT-2 calendar semver helpers shared by build and release scripts.

Internal (internal@): YY.M.DNN with optional -alpha or -beta (day in patch).
External (v): YY.M.N with N in 0-9, optional -alpha.N or -beta.N prereleases.

Calendar components use US Eastern (America/New_York).
"""

from __future__ import annotations

import re
from datetime import date, datetime
from typing import Literal, Optional, Tuple
from zoneinfo import ZoneInfo

OT2_RELEASE_TZ = ZoneInfo("America/New_York")
OT2_MONTH = r"(?:[1-9]|1[0-2])"
OT2_MONTH_CAP = r"([1-9]|1[0-2])"

# Internal: patch is DNN (>= 101), optional bare -alpha / -beta
OT2_INTERNAL_VERSION_RE = re.compile(
    rf"^(\d{{2}})\.{OT2_MONTH_CAP}\.(\d+)(?:-(alpha|beta))?$"
)
OT2_INTERNAL_TAG_RE = re.compile(
    rf"^internal@((\d{{2}})\.{OT2_MONTH_CAP}\.(\d+)(?:-(alpha|beta))?)$"
)

# External: patch N is 0-9, prerelease is -alpha.N or -beta.N
OT2_EXTERNAL_VERSION_RE = re.compile(
    rf"^(\d{{2}})\.{OT2_MONTH_CAP}\.([0-9])(?:-(alpha|beta)\.(\d+))?$"
)
OT2_EXTERNAL_TAG_RE = re.compile(
    rf"^v((\d{{2}})\.{OT2_MONTH_CAP}\.([0-9])(?:-(alpha|beta)\.(\d+))?)$"
)

Ot2Stability = Literal["stable", "alpha", "beta"]


def ot2_release_date_today() -> date:
    """Return today's calendar date in US Eastern."""
    return datetime.now(OT2_RELEASE_TZ).date()


# --- Internal (YY.M.DNN) -----------------------------------------------------


def encode_ot2_internal_version(year: int, month: int, day: int, build_num: int = 1) -> str:
    """Encode internal semver: YY.M.DNN where DNN = day * 100 + same-day build number."""
    if build_num < 1 or build_num > 99:
        raise ValueError("build_num must be between 1 and 99")
    if day < 1 or day > 31:
        raise ValueError("day must be between 1 and 31")

    yy = year % 100
    patch = day * 100 + build_num
    return f"{yy}.{month}.{patch}"


def decode_ot2_internal_version(version: str) -> Tuple[int, int, int, int, Optional[str]]:
    """Decode internal semver into (year, month, day, build_num, prerelease)."""
    clean = version.lstrip("v")
    match = OT2_INTERNAL_VERSION_RE.match(clean)
    if match is None:
        raise ValueError(f"Invalid OT-2 internal version: {version}")

    yy = int(match.group(1))
    month = int(match.group(2))
    patch = int(match.group(3))
    prerelease = match.group(4)
    year = 2000 + yy

    if 100 <= patch <= 999:
        day = patch // 100
        build_num = patch % 100
        if 1 <= day <= 9 and build_num >= 1:
            return year, month, day, build_num, prerelease

    if 1000 <= patch <= 3199:
        day = patch // 100
        build_num = patch % 100
        if 10 <= day <= 31 and build_num >= 1:
            return year, month, day, build_num, prerelease

    raise ValueError(f"Invalid OT-2 internal version patch component: {version}")


def ot2_internal_version_for_date(release_date: date | None = None, build_num: int = 1) -> str:
    """Return internal semver for a calendar date (Eastern by default)."""
    if release_date is None:
        release_date = ot2_release_date_today()
    return encode_ot2_internal_version(
        release_date.year, release_date.month, release_date.day, build_num
    )


# --- External (YY.M.N) -------------------------------------------------------


def encode_ot2_external_version(
    year: int,
    month: int,
    release_num: int = 0,
    prerelease: Optional[str] = None,
    prerelease_num: Optional[int] = None,
) -> str:
    """Encode external semver: YY.M.N with optional -alpha.N or -beta.N."""
    if release_num < 0 or release_num > 9:
        raise ValueError("release_num must be between 0 and 9")
    if month < 1 or month > 12:
        raise ValueError("month must be between 1 and 12")

    yy = year % 100
    version = f"{yy}.{month}.{release_num}"
    if prerelease is not None:
        if prerelease not in ("alpha", "beta"):
            raise ValueError("prerelease must be alpha or beta")
        if prerelease_num is None or prerelease_num < 0:
            raise ValueError("prerelease_num must be a non-negative integer")
        version = f"{version}-{prerelease}.{prerelease_num}"
    return version


def decode_ot2_external_version(
    version: str,
) -> Tuple[int, int, int, Optional[str], Optional[int]]:
    """Decode external semver into (year, month, release_num, prerelease, prerelease_num)."""
    clean = version.lstrip("v")
    match = OT2_EXTERNAL_VERSION_RE.match(clean)
    if match is None:
        raise ValueError(f"Invalid OT-2 external version: {version}")

    yy = int(match.group(1))
    month = int(match.group(2))
    release_num = int(match.group(3))
    prerelease = match.group(4)
    prerelease_num = int(match.group(5)) if match.group(5) is not None else None
    return 2000 + yy, month, release_num, prerelease, prerelease_num


def ot2_external_version_for_month(release_date: date | None = None, release_num: int = 0) -> str:
    """Return external semver for the calendar month (Eastern by default), N starting at 0."""
    if release_date is None:
        release_date = ot2_release_date_today()
    return encode_ot2_external_version(release_date.year, release_date.month, release_num)


# --- Tag helpers -------------------------------------------------------------


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


def ot2_prerelease_for_stability(stability: Ot2Stability) -> Optional[str]:
    """Map stability choice to internal bare prerelease suffix, if any."""
    if stability == "stable":
        return None
    return stability


def allocate_next_internal_tag(
    existing_tags: set[str],
    stability: Ot2Stability = "stable",
    release_date: date | None = None,
) -> str:
    """Pick the next internal@ tag for a calendar day and stability channel."""
    if release_date is None:
        release_date = ot2_release_date_today()

    expected_prerelease = ot2_prerelease_for_stability(stability)
    same_day_builds: list[int] = []

    for tag in existing_tags:
        try:
            version = version_from_internal_tag(tag)
            if version is None:
                continue
            year, month, day, build_num, prerelease = decode_ot2_internal_version(version)
        except ValueError:
            continue
        if (
            (year, month, day)
            == (release_date.year, release_date.month, release_date.day)
            and prerelease == expected_prerelease
        ):
            same_day_builds.append(build_num)

    next_build = max(same_day_builds, default=0) + 1
    next_version = encode_ot2_internal_version(
        release_date.year, release_date.month, release_date.day, next_build
    )
    if expected_prerelease is not None:
        next_version = f"{next_version}-{expected_prerelease}"
    return f"internal@{next_version}"


def allocate_next_external_tag(
    existing_tags: set[str],
    stability: Ot2Stability = "stable",
    base_version: str | None = None,
    release_date: date | None = None,
) -> str:
    """Pick the next v tag for the calendar month and stability channel."""
    if release_date is None:
        release_date = ot2_release_date_today()

    if stability == "stable":
        same_month_nums: list[int] = []
        for tag in existing_tags:
            version = version_from_external_tag(tag)
            if version is None:
                continue
            try:
                year, month, release_num, prerelease, _ = decode_ot2_external_version(version)
            except ValueError:
                continue
            if (
                (year, month) == (release_date.year, release_date.month)
                and prerelease is None
            ):
                same_month_nums.append(release_num)
        next_num = max(same_month_nums, default=-1) + 1
        if next_num > 9:
            raise ValueError("More than 10 external stable releases this month (N > 9)")
        next_version = encode_ot2_external_version(release_date.year, release_date.month, next_num)
        return f"v{next_version}"

    if base_version is None:
        base_version = ot2_external_version_for_month(release_date, 0)

    year, month, release_num, _, _ = decode_ot2_external_version(base_version)
    if (year, month) != (release_date.year, release_date.month):
        raise ValueError("base_version month must match release month")

    same_prerelease_nums: list[int] = []
    for tag in existing_tags:
        version = version_from_external_tag(tag)
        if version is None:
            continue
        try:
            tag_year, tag_month, tag_num, tag_pre, tag_pre_num = decode_ot2_external_version(version)
        except ValueError:
            continue
        if (
            (tag_year, tag_month, tag_num) == (year, month, release_num)
            and tag_pre == stability
            and tag_pre_num is not None
        ):
            same_prerelease_nums.append(tag_pre_num)

    next_pre_num = max(same_prerelease_nums, default=-1) + 1
    next_version = encode_ot2_external_version(
        year, month, release_num, stability, next_pre_num
    )
    return f"v{next_version}"


# Backward-compatible aliases (internal)
encode_ot2_version = encode_ot2_internal_version
decode_ot2_version = decode_ot2_internal_version
ot2_version_for_date = ot2_internal_version_for_date
