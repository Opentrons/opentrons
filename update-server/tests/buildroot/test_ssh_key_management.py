import contextlib
import hashlib
import os

import pytest

from otupdate.common import ssh_key_management


@pytest.fixture
def dummy_authorized_keys(tmpdir, monkeypatch):
    path = os.path.join(tmpdir, "authorized_keys")
    open(path, "w").write("")

    @contextlib.contextmanager
    def ak(mode="r"):
        with open(path, mode) as a:
            yield a

    monkeypatch.setattr(ssh_key_management, "authorized_keys", ak)

    return path


async def test_interface_restriction(test_cli, dummy_authorized_keys):
    resp = await test_cli.get("/server/ssh_keys")
    assert resp.status == 403
    body = await resp.json()
    assert body["error"] == "bad-interface"
    assert "message" in body

    for ok_ip in ["169.254.0.1", "fe80::e6a5:c57d:7659:266d"]:
        resp = await test_cli.get("/server/ssh_keys", headers={"X-Host-IP": ok_ip})
        assert resp.status == 200

    for bad_ip in ["192.168.0.1", "10.2.6.1"]:
        resp = await test_cli.get("/server/ssh_keys", headers={"X-Host-IP": bad_ip})
        assert resp.status == 403


async def test_list_keys(test_cli, dummy_authorized_keys):
    resp = await test_cli.get("/server/ssh_keys", headers={"X-Host-IP": "169.254.1.1"})
    assert resp.status == 200
    body = await resp.json()
    assert body["public_keys"] == []

    dummy_key = "ssh-rsa ahaubsfalsijdbalsjdhbfajsdbfafasdk test@opentrons.com"
    with open(dummy_authorized_keys, "w") as ak:
        ak.write(dummy_key + "\n")

    resp = await test_cli.get("/server/ssh_keys", headers={"X-Host-IP": "169.254.1.1"})
    assert resp.status == 200
    body = await resp.json()
    assert body["public_keys"] == [
        {
            "key_md5": hashlib.new("md5", dummy_key.encode()).hexdigest(),
            "key": dummy_key,
        }
    ]


async def test_add_key_successes(test_cli, dummy_authorized_keys):
    dummy_key = "ssh-rsa ahaubsfalsijdbalsjdhbfajsdbfafasdk test@opentrons.com"
    resp = await test_cli.post(
        "/server/ssh_keys",
        json={"key": dummy_key},
        headers={"X-Host-IP": "169.254.1.1"},
    )
    assert resp.status == 201
    body = await resp.json()
    assert "message" in body
    assert body["key_md5"] == hashlib.new("md5", dummy_key.encode()).hexdigest()
    assert open(dummy_authorized_keys).read() == dummy_key + "\n"

    # Do the same test again to make sure it works but there isn’t a
    # duplicate key
    resp = await test_cli.post(
        "/server/ssh_keys",
        json={"key": dummy_key},
        headers={"X-Host-IP": "169.254.1.1"},
    )
    assert resp.status == 201
    body = await resp.json()
    assert "message" in body
    assert body["key_md5"] == hashlib.new("md5", dummy_key.encode()).hexdigest()
    assert open(dummy_authorized_keys).read() == dummy_key + "\n"


@pytest.mark.parametrize(
    "expected_error, body",
    [
        ("no-key", {}),
        ("no-key", {"key": 123}),
        ("bad-key", {"key": ""}),
        ("bad-key", {"key": "     "}),
        ("bad-key", {"key": "not even close to a pubkey"}),
        ("bad-key", {"key": "ssh-rsa \ngotcha"}),  # Bad because of embedded \n.
    ],
)
async def test_add_key_errors(test_cli, dummy_authorized_keys, expected_error, body):
    resp = await test_cli.post(
        "/server/ssh_keys", json=body, headers={"X-Host-IP": "169.254.1.1"}
    )
    assert resp.status == 400
    body = await resp.json()
    assert body["error"] == expected_error
    assert "message" in body


async def test_delete_key(test_cli, dummy_authorized_keys):
    dummy_key = "ssh-rsa ahaubsfalsijdbalsjdhbfajsdbfafasdk test@opentrons.com"
    resp = await test_cli.post(
        "/server/ssh_keys",
        json={"key": dummy_key},
        headers={"X-Host-IP": "169.254.1.1"},
    )
    assert resp.status == 201

    hashval = hashlib.new("md5", dummy_key.encode()).hexdigest()
    resp = await test_cli.delete(
        f"/server/ssh_keys/{hashval}", headers={"X-Host-IP": "169.254.1.1"}
    )
    assert resp.status == 200
    body = await resp.json()
    assert "message" in body

    resp = await test_cli.delete(
        f"/server/ssh_keys/{hashval}", headers={"X-Host-IP": "169.254.1.1"}
    )
    assert resp.status == 404
    body = await resp.json()
    assert body["error"] == "invalid-key-hash"
    assert "message" in body


async def test_clear_keys(test_cli, dummy_authorized_keys):
    dummy_keys = (
        "ssh-rsa ahaubsfalsijdbalsjdhbfajsdbfafasdk test@opentrons.com",
        "ssh-rsa ivnisjndfiushdfiughsdiofjaojsdhkaj test@opentrons.com",
    )
    for key in dummy_keys:
        resp = await test_cli.post(
            "/server/ssh_keys", json={"key": key}, headers={"X-Host-IP": "169.254.1.1"}
        )
        assert resp.status == 201
    assert open(dummy_authorized_keys).read() == "\n".join(dummy_keys) + "\n"
    resp = await test_cli.delete(
        "/server/ssh_keys", headers={"X-Host-IP": "169.254.1.1"}
    )
    assert resp.status == 200
    body = await resp.json()
    assert "message" in body
    assert "restart_url" in body

    assert open(dummy_authorized_keys).read() == "\n"
