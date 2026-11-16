#!/usr/bin/env python3
"""Build versions.json for the release index page.

Reads GitHub releases and tags, PyPI, and the Flex build manifest, and writes
one JSON file. The page reads only that file, so it needs no GitHub, PyPI, or
CORS access at view time.

Usage:
    python3 build_versions.py [--out PATH]

Set GITHUB_TOKEN to raise GitHub's rate limit (60 requests/hour unauthenticated).
If any source fails, nothing is written and the script exits 1, so a bad run
never replaces the last good file.
"""

import argparse
import datetime
import json
import os
import re
import sys
import urllib.request
from urllib.parse import quote

GITHUB_API = "https://api.github.com"
FLEX_MANIFEST = "https://builds.opentrons.com/ot3-oe/releases.json"
PYPI = "https://pypi.org/pypi"

ROBOT_TAG_VERSION = re.compile(r"^v(\d+\.\d+\.\d+(?:-(?:alpha|beta)\.\d+)?)$")
SEMVER = re.compile(r"(\d+)\.(\d+)\.(\d+)(?:[-.]?(alpha|beta|rc)\.?(\d+))?", re.IGNORECASE)
DOCS_TAG = re.compile(r"^mkdocs-(\d{4}-\d{2}-\d{2})$")
PRERELEASE = re.compile(r"alpha|beta|rc|candidate|\d[ab]\d", re.IGNORECASE)


def http_json(url):
    headers = {"User-Agent": "opentrons-version-index", "Accept": "application/vnd.github+json"}
    token = os.environ.get("GITHUB_TOKEN")
    if token and url.startswith(GITHUB_API):
        headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.load(response)


def github_releases(repo, max_pages=50):
    """Published (non-draft) releases only. Drafts need a login to read.

    The list includes drafts and is sorted by creation date, so published
    releases can sit many pages deep. Read until the list ends.
    """
    releases = []
    for page in range(1, max_pages + 1):
        batch = http_json(f"{GITHUB_API}/repos/{repo}/releases?per_page=100&page={page}")
        releases.extend(r for r in batch if not r["draft"])
        if len(batch) < 100:
            return releases
    raise RuntimeError(f"{repo}: more than {max_pages * 100} releases; raise max_pages")


def github_tags(prefix):
    refs = http_json(f"{GITHUB_API}/repos/Opentrons/opentrons/git/matching-refs/tags/{quote(prefix, safe='')}")
    tags = (ref["ref"].removeprefix("refs/tags/") for ref in refs)
    return [t for t in tags if t.startswith(prefix) and not t.startswith("staging-")]


def semver_key(name):
    """Sort key so newer versions compare greater. Stable > beta > alpha for equal numbers."""
    match = SEMVER.search(name)
    if not match:
        return None
    kind = (match.group(4) or "").lower()
    rank = 1 if kind == "alpha" else 2 if kind in ("beta", "rc") else 3
    return (int(match.group(1)), int(match.group(2)), int(match.group(3)), rank, int(match.group(5) or 0))


def asset_label(name):
    lower = name.lower()
    if lower.endswith(".dmg"):
        return "macOS app"
    if lower.endswith(".exe"):
        return "Windows app"
    if lower.endswith(".appimage"):
        return "Linux app"
    if lower.startswith("ot3-system") and lower.endswith(".zip"):
        return "Flex system update"
    if lower.startswith("ot3-fullimage"):
        return "Flex full image"
    if lower.startswith("ot2-system") and lower.endswith(".zip"):
        return "OT-2 system update"
    if lower.startswith("ot2-fullimage"):
        return "OT-2 full image"
    if lower.startswith("version") and lower.endswith(".json"):
        return "Version manifest"
    return None


def release_assets(release, keep=lambda label, name: True):
    assets = []
    for asset in release["assets"]:
        label = asset_label(asset["name"])
        if label and keep(label, asset["name"]):
            assets.append({"name": asset["name"], "url": asset["browser_download_url"], "label": label})
    return sorted(assets, key=lambda a: (a["label"], a["name"]))


def is_ot2_asset(label, name):
    return label.startswith("OT-2") or bool(re.search("ot2", name, re.IGNORECASE))


def release_item(release, assets):
    tag = release["tag_name"]
    return {
        "version": tag,
        "url": release["html_url"],
        "date": release["published_at"],
        "prerelease": bool(release.get("prerelease")) or bool(PRERELEASE.search(tag)),
        "unpublished": False,
        "assets": assets,
    }


def tag_items(tags, prefix):
    """Items for tags with no GitHub release. Links to the tag, not a release page."""
    items = []
    for tag in tags:
        version = tag[len(prefix):]
        if semver_key(version) is None:
            continue
        items.append({
            "version": version,
            "url": f"https://github.com/Opentrons/opentrons/tree/{quote(tag)}",
            "date": None,
            "prerelease": bool(PRERELEASE.search(version)),
            "unpublished": False,
            "assets": [],
        })
    return sorted(items, key=lambda i: semver_key(i["version"]) or (0,), reverse=True)


def build_app():
    releases = github_releases("Opentrons/opentrons")
    robot = [r for r in releases if re.match(r"^v\d", r["tag_name"])]
    published = {r["tag_name"] for r in robot}

    flex = []
    for release in robot:
        assets = release_assets(release, lambda label, name: not is_ot2_asset(label, name))
        if assets:
            flex.append(release_item(release, assets))

    ot2_historical = []
    for release in robot:
        assets = release_assets(release, is_ot2_asset)
        if assets:
            ot2_historical.append(release_item(release, assets))

    builds = http_json(FLEX_MANIFEST).get("productionV2", {})
    for tag in github_tags("v"):
        match = ROBOT_TAG_VERSION.match(tag)
        if not match or tag in published:
            continue
        entry = builds.get(match.group(1))
        if not entry:
            continue
        version = match.group(1)
        assets = []
        if entry.get("system"):
            assets.append({"name": f"ot3-system-{version}.zip", "url": entry["system"], "label": "Flex system update"})
        if entry.get("fullImage"):
            assets.append({"name": f"ot3-fullimage-{version}.tar", "url": entry["fullImage"], "label": "Flex full image"})
        if entry.get("version"):
            assets.append({"name": f"VERSION-{version}.json", "url": entry["version"], "label": "Version manifest"})
        flex.append({
            "version": tag,
            "url": f"https://github.com/Opentrons/opentrons/tree/{quote(tag)}",
            "date": None,
            "prerelease": bool(PRERELEASE.search(tag)),
            "unpublished": True,
            "assets": assets,
        })

    flex.sort(key=lambda i: semver_key(i["version"]) or (0,), reverse=True)
    return flex, ot2_historical


def build_ot2(ot2_historical):
    fresh = []
    for release in github_releases("Opentrons/opentrons-ot2"):
        if not re.match(r"^v\d", release["tag_name"]):
            continue
        assets = release_assets(release)
        if assets:
            fresh.append(release_item(release, assets))
    return sorted(fresh + ot2_historical, key=lambda i: i["date"] or "", reverse=True)


def build_pypi():
    data = http_json(f"{PYPI}/opentrons/json")
    rows = []
    for version, files in data["releases"].items():
        if not files:
            continue
        date = max(f["upload_time"] for f in files)
        rows.append({
            "version": version,
            "url": f"https://pypi.org/project/opentrons/{version}/",
            "date": date,
            "prerelease": bool(PRERELEASE.search(version)),
            "unpublished": False,
            "assets": [],
        })
    rows.sort(key=lambda i: i["date"] or "", reverse=True)
    shared = http_json(f"{PYPI}/opentrons-shared-data/json")["info"]["version"]
    return rows, shared


def build_docs():
    items = []
    for tag in github_tags("mkdocs-"):
        match = DOCS_TAG.match(tag)
        if not match:
            continue
        items.append({
            "version": match.group(1),
            "url": f"https://github.com/Opentrons/opentrons/tree/{quote(tag)}",
            "date": f"{match.group(1)}T00:00:00Z",
            "prerelease": False,
            "unpublished": False,
            "assets": [],
        })
    return sorted(items, key=lambda i: i["date"], reverse=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--out", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "versions.json"))
    args = parser.parse_args()

    errors = []
    results = {}

    def run(name, fn):
        try:
            results[name] = fn()
        except Exception as error:  # noqa: BLE001 - report every failing source
            errors.append(f"{name}: {error}")

    app_result = {}

    def app_job():
        flex, ot2_historical = build_app()
        app_result["ot2_historical"] = ot2_historical
        return flex

    run("app", app_job)
    run("ot2", lambda: build_ot2(app_result.get("ot2_historical", [])))
    run("protocol_designer", lambda: tag_items(github_tags("protocol-designer@"), "protocol-designer@"))
    run("labware_library", lambda: tag_items(github_tags("labware-library@"), "labware-library@"))
    run("docs", build_docs)

    def python_job():
        rows, shared = build_pypi()
        results["shared_data_latest"] = shared
        return rows

    run("python", python_job)

    if errors:
        for line in errors:
            print(f"error: {line}", file=sys.stderr)
        print("Not writing versions.json; the last good file is unchanged.", file=sys.stderr)
        return 1

    payload = {
        "generated_at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "app": results["app"],
        "ot2": results["ot2"],
        "protocol_designer": results["protocol_designer"],
        "labware_library": results["labware_library"],
        "docs": results["docs"],
        "python": results["python"],
        "shared_data_latest": results["shared_data_latest"],
    }
    with open(args.out, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)
        handle.write("\n")
    counts = {k: len(v) for k, v in payload.items() if isinstance(v, list)}
    print(f"Wrote {args.out}: {counts}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
