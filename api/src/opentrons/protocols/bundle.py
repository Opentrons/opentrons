"""
functions and utilities for handling zipped protocol bundles
"""
from datetime import date
import json
from pathlib import PurePosixPath, PurePath
from typing import Dict, BinaryIO, TYPE_CHECKING
from zipfile import ZipFile

from opentrons.calibration_storage.helpers import uri_from_definition

from .types import BundleContents

if TYPE_CHECKING:
    from opentrons_shared_data.labware.types import LabwareDefinition

MAIN_PROTOCOL_FILENAME = "protocol.ot2.py"
LABWARE_DIR = "labware"
DATA_DIR = "data"


def _has_files_at_root(zipFile: ZipFile) -> bool:
    for zipInfo in zipFile.infolist():
        if zipInfo.filename.count("/") == 0:
            return True
    return False


def extract_bundle(bundle: ZipFile) -> BundleContents:  # noqa: C901
    """Extract a bundle and verify its contents and structure."""
    if not _has_files_at_root(bundle):
        raise RuntimeError(
            "No files found in ZIP file's root directory. When selecting "
            "files to zip, make sure to directly select the files "
            "themselves. Do not select their parent directory, which would "
            "result in nesting all files inside that directory in the ZIP."
        )
    try:
        with bundle.open(MAIN_PROTOCOL_FILENAME, "r") as protocol_file:
            py_protocol = protocol_file.read().decode("utf-8")
    except KeyError:
        raise RuntimeError(
            f"Bundled protocol should have a {MAIN_PROTOCOL_FILENAME} "
            + "file in the root directory"
        )
    bundled_labware: Dict[str, "LabwareDefinition"] = {}
    bundled_data = {}
    bundled_python = {}
    for zipInfo in bundle.infolist():
        filepath = PurePosixPath(zipInfo.filename)
        rootpath = filepath.parts[0]

        # skip directories and weird OS-added directories
        # (note: the __MACOSX dir would contain '__MACOSX/foo.py'
        # and other files. This would break our inferences, so we need
        # to exclude all contents of that directory)
        if rootpath == "__MACOSX" or zipInfo.is_dir():
            continue

        with bundle.open(zipInfo) as f:
            if rootpath == LABWARE_DIR and filepath.suffix == ".json":
                labware_def = json.loads(f.read().decode("utf-8"))
                labware_key = uri_from_definition(labware_def)
                if labware_key in bundled_labware:
                    raise RuntimeError(f"Conflicting labware in bundle: {labware_key}")
                bundled_labware[labware_key] = labware_def
            elif rootpath == DATA_DIR:
                # note: data files are read as binary
                bundled_data[str(filepath.relative_to(DATA_DIR))] = f.read()
            elif filepath.suffix == ".py" and str(filepath) != MAIN_PROTOCOL_FILENAME:
                bundled_python[str(filepath)] = f.read().decode("utf-8")

    if not bundled_labware:
        raise RuntimeError("No labware definitions found in bundle.")

    return BundleContents(py_protocol, bundled_labware, bundled_data, bundled_python)


def create_bundle(contents: BundleContents, into_file: BinaryIO) -> None:
    """Create a bundle from assumed-good contents"""
    with ZipFile(into_file, mode="w") as zf:
        zf.writestr(MAIN_PROTOCOL_FILENAME, contents.protocol)
        for dataname, datafile in contents.bundled_data.items():
            name = PurePath(dataname).name
            zf.writestr(f"{DATA_DIR}/{name}", datafile)
        for lwdef in contents.bundled_labware.values():
            zipsafe = uri_from_definition(lwdef, "-")
            zf.writestr(f"{LABWARE_DIR}/{zipsafe}.json", json.dumps(lwdef))
        zf.writestr(".bundle_beta", str(date.today()))
