import json
import os
import pathlib

from opentrons.util.entrypoint_util import (labware_from_paths,
                                            datafiles_from_paths)


def test_labware_from_paths(tmpdir, get_labware_fixture):
    os.mkdir(os.path.join(tmpdir, 'path-1'))
    os.mkdir(os.path.join(tmpdir, 'path-2'))
    lw1 = get_labware_fixture('fixture_96_plate')
    lw2 = get_labware_fixture('fixture_24_tuberack')
    lw3 = get_labware_fixture('fixture_irregular_example_1')
    with open(os.path.join(tmpdir, 'path-1', 'labware1.json'), 'w') as lwtemp:
        json.dump(lw1, lwtemp)
    with open(os.path.join(tmpdir, 'path-1', 'labware2.json'), 'w') as lwtemp:
        json.dump(lw2, lwtemp)
    with open(os.path.join(tmpdir, 'path-2', 'labware3.json'), 'w') as lwtemp:
        json.dump(lw3, lwtemp)
    with open(os.path.join(tmpdir, 'path-2', 'invalid.json'), 'w') as lwtemp:
        lwtemp.write('asdjkashdkajvka')
    with open(os.path.join(tmpdir, 'path-2', 'notevenjson'), 'w') as lwtemp:
        lwtemp.write('bgbbabcba')

    res = labware_from_paths([os.path.realpath(os.path.join(tmpdir, 'path-1')),
                              pathlib.Path(os.path.join(tmpdir, 'path-2'))])
    assert sorted(res) == sorted({
        'fixture/fixture_96_plate/1': lw1,
        'fixture/fixture_24_tuberack/1': lw2,
        'fixture/fixture_irregular_example_1/1': lw2})


def test_datafiles_from_paths(tmpdir):
    os.mkdir(os.path.join(tmpdir, 'path-1'))
    os.mkdir(os.path.join(tmpdir, 'path-2'))
    with open(os.path.join(tmpdir, 'path-1', 'test3'), 'wb') as f:
        f.write('oh hey there checkitout'.encode('utf-8'))
    with open(os.path.join(tmpdir, 'path-2', 'test2'), 'wb') as f:
        f.write('oh man this isnt even utf8'.encode('utf-16'))
    with open(os.path.join(tmpdir, 'path-2', 'test1'), 'wb') as f:
        f.write("wait theres a second file???".encode())
    with open(os.path.join(tmpdir, 'test-file'), 'wb') as f:
        f.write("this isnt even in a directory".encode())

    res = datafiles_from_paths([
        os.path.join(tmpdir, 'path-1'),
        pathlib.Path(os.path.join(tmpdir, 'path-2')),
        os.path.join(tmpdir, 'test-file')])
    assert sorted(res) == sorted({
        'test3': 'oh hey there checkitout'.encode('utf-8'),
        'test2': 'oh man this isnt even utf8'.encode('utf-16'),
        'test1': 'wait theres a second file???'.encode(),
        'test-file': "this isnt even in a directory".encode()
    })
