from otupdate.buildroot import name_management
import pytest
from collections import Counter

async def test_name_endpoint(test_cli, monkeypatch):
    async def fake_name(name):
        return name + name

    monkeypatch.setattr(name_management, 'set_name', fake_name)

    to_set = 'check out this cool name'
    resp = await test_cli.post('/server/name',
                               json={'name': to_set})
    assert resp.status == 200
    body = await resp.json()
    assert body['name'] == to_set + to_set

    health = await test_cli.get('/server/update/health')
    health_body = await health.json()
    assert health_body['name'] == to_set + to_set
    get_name = await test_cli.get('/server/name')
    name_body = await get_name.json()
    assert name_body['name'] == to_set + to_set

    resp = await test_cli.post('/server/name',
                               json={'name': 2})
    assert resp.status == 400
    body = await resp.json()
    assert 'message' in body
    health = await test_cli.get('/server/update/health')
    health_body = await health.json()
    assert health_body['name'] == to_set + to_set
    get_name = await test_cli.get('/server/name')
    name_body = await get_name.json()
    assert name_body['name'] == to_set + to_set

    resp = await test_cli.post('/server/name',
                               json={})
    assert resp.status == 400
    body = await resp.json()
    assert 'message' in body
    health = await test_cli.get('/server/update/health')
    health_body = await health.json()
    assert health_body['name'] == to_set + to_set


machine_info_examples = [
    '',
    'FOO=foo',
    'PRETTY_HOSTNAME=initial_pretty_hostname',
    'FOO=foo\nPRETTY_HOSTNAME=initial_pretty_hostname\nBAR=bar'
]


@pytest.mark.parametrize('initial_contents', machine_info_examples)
def test_rewrite_machine_info_updates_pretty_hostname(initial_contents):
    rewrite = name_management._rewrite_machine_info(initial_contents, 'new_pretty_hostname')
    assert 'PRETTY_HOSTNAME=new_pretty_hostname' in rewrite.splitlines(), 'new PRETTY_HOSTNAME should be present.'
    assert rewrite.count('PRETTY_HOSTNAME') == 1, 'Old PRETTY_HOSTNAME should be deleted.'


@pytest.mark.parametrize('initial_contents', machine_info_examples)
def test_rewrite_machine_info_preserves_other_lines(initial_contents):
    intitial_lines = Counter(initial_contents.splitlines())
    rewrite_string = name_management._rewrite_machine_info(initial_contents, 'new_pretty_hostname')
    rewrite_lines = Counter(rewrite_string.splitlines())
    lost_lines = intitial_lines - rewrite_lines
    for line in lost_lines:
        # Lines are only allowed to be "lost" in the rewrite if they were an
        # old PRETTY_HOSTNAME assignment, or were blank.
        assert line.startswith('PRETTY_HOSTNAME=') or line == ''


@pytest.mark.parametrize('initial_contents', machine_info_examples)
def test_rewrite_machine_info_is_idempotent(initial_contents):
    first_rewrite = name_management._rewrite_machine_info(initial_contents, 'new_pretty_hostname')
    second_rewrite = name_management._rewrite_machine_info(first_rewrite, 'new_pretty_hostname')
    assert second_rewrite == first_rewrite
