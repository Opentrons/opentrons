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
    with open(out_dir / filename, "w", encoding="utf-8") as f:
        f.write("\n".join(notes).strip() + "\n")


# Write files with dynamic names
if latest is not None:
    write_notes(f"release-notes-v{latest}.md", latest_notes)
if previous is not None:
    write_notes(f"release-notes-v{previous}.md", previous_notes)
write_notes("release-notes-legacy.md", legacy_notes)

print("Release notes split and written to:")
if latest is not None:
    print(f"- {out_dir / f'release-notes-v{latest}.md'}")
if previous is not None:
    print(f"- {out_dir / f'release-notes-v{previous}.md'}")
print(f"- {out_dir / 'release-notes-legacy.md'}")
