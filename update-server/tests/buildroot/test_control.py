""" test the endpoints in otupdate.buildroot.control """

import asyncio
import json
import os
from unittest import mock

from otupdate.buildroot import control


async def test_health(test_cli):
    resp = await test_cli.get('/server/update/health')
    assert resp.status == 200
    body = await resp.json()
    assert body['name'] == 'opentrons-test'
    version_dict = json.load(open(os.path.join(os.path.dirname(__file__),
                                               'version.json')))
    assert body['updateServerVersion'] == version_dict['update_server_version']
    assert body['apiServerVersion'] == version_dict['opentrons_api_version']
    assert body['smoothieVersion'] == 'unimplemented'
    assert body['systemVersion'] == version_dict['buildroot_version']


async def test_restart(test_cli, monkeypatch):
    restart_mock = mock.Mock()
    monkeypatch.setattr(control, '_do_restart', restart_mock)
    resp = await test_cli.post('/server/update/restart')
    assert resp.status == 200
    assert not restart_mock.called
    await asyncio.sleep(1.01)
    assert restart_mock.called


def test_name_restrictions():
    assert control.hostname_from_pretty_name(
        'This.namé has 🤓 and is really excessively long.'
        ' really damn long like longer')\
        == "This-nam--has---and-is-really-excessively-long--really-"


async def test_update_name(monkeypatch):
    longname = 'This.namé has 🤓 and is really excessively long.'\
        ' really damn long like longer'
    shortname = "This-nam--has---and-is-really-excessively-long--really-"
    called_us = False
    called_wnd = False

    async def _update_system(name):
        nonlocal called_us
        assert name == shortname
        called_us = True

    def _write_name_details(name, prettyname):
        nonlocal called_wnd
        assert name == shortname
        assert prettyname == longname
        called_wnd = True

    monkeypatch.setattr(control,
                        'update_system_for_name', _update_system)
    monkeypatch.setattr(control,
                        '_write_name_details', _write_name_details)

    calced_shortname = await control.update_name(longname)
    assert calced_shortname == shortname
    assert called_us
    assert called_wnd


async def test_name_endpoint(test_cli, monkeypatch):
    longname = 'This.namé has 🤓 and is really excessively long.'\
        ' really damn long like longer'
    shortname = "This-nam--has---and-is-really-excessively-long--really-"
    called_us = False
    called_wnd = False

    async def _update_system(name):
        nonlocal called_us
        assert name == shortname
        called_us = True

    def _write_name_details(name, prettyname):
        nonlocal called_wnd
        assert name == shortname
        assert prettyname == longname
        called_wnd = True

    monkeypatch.setattr(control,
                        'update_system_for_name', _update_system)
    monkeypatch.setattr(control,
                        '_write_name_details', _write_name_details)

    resp = await test_cli.post('/server/name',
                               json={'name': longname})
    assert resp.status == 200
    assert called_us
    assert called_wnd
    body = await resp.json()
    assert body['hostname'] == shortname
    assert body['prettyname'] == longname

    health = await test_cli.get('/server/update/health')
    health_body = await health.json()
    assert health_body['name'] == longname

    resp = await test_cli.post('/server/name',
                               json={'name': 2})
    assert resp.status == 400
    body = await resp.json()
    assert 'message' in body
    health = await test_cli.get('/server/update/health')
    health_body = await health.json()
    assert health_body['name'] == longname
    resp = await test_cli.post('/server/name',
                               json={})
    assert resp.status == 400
    body = await resp.json()
    assert 'message' in body
    health = await test_cli.get('/server/update/health')
    health_body = await health.json()
    assert health_body['name'] == longname
