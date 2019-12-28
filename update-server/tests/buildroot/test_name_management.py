from otupdate.buildroot import name_management


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


def test_rewrite_machine_info_idempotent():
    initial_contents = "PRETTY_HOSTNAME=foo\nSOME_OTHER_VARIABLE=some_other_variable\n"
    first_rewrite = name_management._rewrite_machine_info(initial_contents, "bar")
    second_rewrite = name_management._rewrite_machine_info(first_rewrite, "bar")
    assert second_rewrite == first_rewrite
