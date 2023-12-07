import json
from pathlib import Path

import pytest
from syrupy.extensions.json import JSONSnapshotExtension
from syrupy.filters import props

# set to_use to base
# pipenv run pytest -k analysis_test.py --snapshot-update
# to test
# set to_use to new
# pipenv run pytest -k analysis_test.py -vv -s

exclude = props(
    "id",
    "createdAt",
    "startedAt",
    "completedAt",
    "lastModified",
    "created",
    "key",
    "pipetteId",
    "labwareId",
    "serialNumber",
    "moduleId",
)


@pytest.fixture
def snapshot_exclude(snapshot):
    return snapshot.with_defaults(exclude=exclude)


@pytest.fixture
def snapshot_json(snapshot_exclude):
    return snapshot_exclude.with_defaults(extension_class=JSONSnapshotExtension)


def get_analyses(stem_keyword):
    path = Path(
        Path(__file__).parent.parent,
        "analysis_results",
    )
    return [file for file in path.glob("*.json") if stem_keyword in file.stem]


def test_analysis_json(snapshot_json):
    base_stem_keyword = "_v7.0.2_"
    alpha_stem_keyword = "_v7.1.0-alpha.2_"
    base = get_analyses(base_stem_keyword)
    new = get_analyses(alpha_stem_keyword)
    print("\n")
    print(f"Base files: {len(base)}")
    print(f"New files: {len(new)}")
    to_use = base  # change me for snapshot
    files_no_exist = []
    for file in to_use:
        if file.exists():
            with open(file, "r") as f:
                data = json.load(f)
                test_name = file.stem.replace(base_stem_keyword, "")
                test_name = test_name.replace(alpha_stem_keyword, "")
                print(f"Test name: {test_name}")
            assert snapshot_json(name=test_name) == data
        else:
            files_no_exist.append(file)
    print(f"Files that do not exist: {files_no_exist}")
