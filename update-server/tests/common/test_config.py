""" Tests for config file loading and backup """
import copy
import json
import os

import pytest

from otupdate.common import config


def test_load_ok(otupdate_config):
    conf = config.load_from_path(otupdate_config)
    config_data = json.load(open(otupdate_config))
    assert conf.signature_required == config_data['signature_required']
    assert conf.download_storage_path == config_data['download_storage_path']
    assert conf.update_cert_path == config_data['update_cert_path']
    assert conf.path == otupdate_config


@pytest.mark.no_cert_path
def test_load_no_cert(otupdate_config):
    conf = config.load_from_path(otupdate_config)
    assert not conf.signature_required
    assert conf.update_cert_path == '/etc/opentrons-robot-signing-key.crt'


@pytest.mark.bad_cert_path
def test_load_bad_cert(otupdate_config):
    conf = config.load_from_path(otupdate_config)
    assert not conf.signature_required
    assert conf.update_cert_path == '/etc/opentrons-robot-signing-key.crt'


def check_defaults(conf, good_cert=True):
    assert conf.signature_required == good_cert
    assert conf.download_storage_path == '/var/lib/otupdate/downloads'
    assert conf.update_cert_path == '/etc/opentrons-robot-signing-key.crt'


def test_load_bad_json(tmpdir):
    path = os.path.join(tmpdir, 'badconfig')
    open(path, 'w').write("this isn't json")
    conf = config.load_from_path(path)
    assert conf.path == path
    check_defaults(conf, False)

    assert json.load(open(path)) == {k: v for k, v in conf._asdict().items()
                                     if k != 'path'}


def test_load_removes_extra_keys(otupdate_config):
    orig = json.load(open(otupdate_config))
    modded = copy.copy(orig)
    modded['this-key-is-extra'] = False
    modded_path = os.path.join(os.path.dirname(otupdate_config), 'modded')
    json.dump(modded, open(modded_path, 'w'))
    config.load_from_path(modded_path)
    reverted = json.load(open(otupdate_config))
    assert reverted == orig


def test_load_defaults_missing(otupdate_config):
    orig = json.load(open(otupdate_config))
    modded = copy.copy(orig)
    del modded['download_storage_path']
    modded_path = os.path.join(os.path.dirname(otupdate_config), 'modded')
    json.dump(modded, open(modded_path, 'w'))
    conf = config.load_from_path(modded_path)
    assert conf.download_storage_path == '/var/lib/otupdate/downloads'
    reverted = json.load(open(modded_path))
    orig['download_storage_path'] = '/var/lib/otupdate/downloads'
    assert orig == reverted


def test_load_defaults_wrong_types(otupdate_config):
    orig = json.load(open(otupdate_config))
    modded = copy.copy(orig)
    modded['download_storage_path'] = 2
    modded_path = os.path.join(os.path.dirname(otupdate_config), 'modded')
    json.dump(modded, open(modded_path, 'w'))
    conf = config.load_from_path(modded_path)
    assert conf.download_storage_path == '/var/lib/otupdate/downloads'
    reverted = json.load(open(modded_path))
    orig['download_storage_path'] = '/var/lib/otupdate/downloads'
    assert orig == reverted


def test_load_wrong_path(tmpdir):
    bad_path = os.path.join(tmpdir, 'nofile.json')
    conf = config.load_from_path(bad_path)
    assert conf.path == bad_path
    loaded = json.load(open(bad_path))
    assert loaded == {k: v for k, v in conf._asdict().items()
                      if k != 'path'}
    check_defaults(conf, False)
