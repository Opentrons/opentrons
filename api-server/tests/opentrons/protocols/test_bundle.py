import io
import zipfile

import pytest

from opentrons.protocols import bundle


def test_parse_bundle_no_root_files(get_bundle_fixture):
    fixture = get_bundle_fixture('no_root_files_bundle')
    with pytest.raises(RuntimeError,
                       match='No files found in ZIP file\'s root directory'):
        buf = io.BytesIO(fixture['binary_zipfile'])
        buf.seek(0)
        zf = zipfile.ZipFile(buf)
        bundle.extract_bundle(zf)


def test_parse_bundle_no_entrypoint_protocol(get_bundle_fixture):
    fixture = get_bundle_fixture('no_entrypoint_protocol_bundle')
    with pytest.raises(RuntimeError,
                       match='Bundled protocol should have a'):
        buf = io.BytesIO(fixture['binary_zipfile'])
        buf.seek(0)
        zf = zipfile.ZipFile(buf)
        bundle.extract_bundle(zf)


def test_parse_bundle_conflicting_labware(get_bundle_fixture):
    fixture = get_bundle_fixture('conflicting_labware_bundle')
    with pytest.raises(RuntimeError,
                       match='Conflicting labware in bundle'):
        buf = io.BytesIO(fixture['binary_zipfile'])
        buf.seek(0)
        zf = zipfile.ZipFile(buf)
        bundle.extract_bundle(zf)


def test_write_bundle(get_bundle_fixture):
    fixture = get_bundle_fixture('simple_bundle')
    buf = io.BytesIO(fixture['binary_zipfile'])
    buf.seek(0)
    zf = zipfile.ZipFile(buf)
    original_contents = bundle.extract_bundle(zf)
    t = io.BytesIO()
    bundle.create_bundle(original_contents, t)
    zf2 = zipfile.ZipFile(t)
    new_contents = bundle.extract_bundle(zf2)
    assert new_contents == original_contents
