import re
import os
from pathlib import Path

# Paths

repo_root = Path(__file__).parent.parent
release_notes_path = repo_root / "app-shell" / "build" / "release-notes.md"
out_dir = repo_root / "docs" / "shared" / "release-notes"
out_dir.mkdir(parents=True, exist_ok=True)

# Read the release notes
with open(release_notes_path, "r", encoding="utf-8") as f:
    content = f.read()

# Split by H2 headers
pattern = re.compile(r"^## Opentrons App Changes in (\d+)\.\d+\.\d+.*$", re.MULTILINE)
sections = []
last_pos = 0
for match in pattern.finditer(content):
    if last_pos != 0:
        sections.append((last_major, content[last_pos:match.start()]))
    last_major = int(match.group(1))
    last_pos = match.start()
# Add the last section
if last_pos != 0:
    sections.append((last_major, content[last_pos:]))

# Group by major version
majors = sorted({major for major, _ in sections}, reverse=True)
latest = majors[0] if majors else None
previous = majors[1] if len(majors) > 1 else None

latest_notes = []
previous_notes = []
legacy_notes = []
for major, text in sections:
    if major == latest:
        latest_notes.append(text)
    elif major == previous:
        previous_notes.append(text)
    else:
        legacy_notes.append(text)

def write_notes(filename, notes):
    # Determine title and explanatory text
    if filename == "latest.md":
        version = latest
        title = f"Opentrons App: v{version} Release Notes"
        metadata = f"---\ntitle: \"{title}\"\n---\n\n"
        explanation = f"This document lists changes made in v{version} of the Opentrons App.\n\n"
    elif filename == "previous.md":
        version = previous
        title = f"Opentrons App: v{version} Release Notes"
        metadata = f"---\ntitle: \"{title}\"\n---\n\n"
        explanation = f"This document lists changes made in v{version} of the Opentrons App.\n\n"
    else:
        title = "Opentrons App: Legacy Release Notes"
        metadata = f"---\ntitle: \"{title}\"\n---\n\n"
        explanation = (
            "This document lists changes made in legacy versions of the Opentrons App.\n\n"
            "!!! note\n"
            "    Opentrons no longer supports using these versions of the Opentrons App. "
            "This document is maintained for historical purposes only.\n\n"
        )
    # Rewrite H2 headers in notes
    rewritten_notes = []
    h2_re = re.compile(r"^## Opentrons App Changes in (\d+\.\d+\.\d+)", re.MULTILINE)
    for note in notes:
        rewritten = h2_re.sub(r"## Version \1", note)
        rewritten_notes.append(rewritten)
    with open(out_dir / filename, "w", encoding="utf-8") as f:
        f.write(metadata)
        f.write(explanation)
        f.write("\n".join(rewritten_notes).strip() + "\n")


# Write files with dynamic names
if latest is not None:
    write_notes("latest.md", latest_notes)
if previous is not None:
    write_notes("previous.md", previous_notes)
write_notes("legacy.md", legacy_notes)

print("Release notes split and written to:")
if latest is not None:
    print(f"- {out_dir / 'latest.md'}")
if previous is not None:
    print(f"- {out_dir / 'previous.md'}")
print(f"- {out_dir / 'legacy.md'}")
