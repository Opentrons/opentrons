import collections
import os
import json
import re
import subprocess
from unittest import mock
import zipfile

import pytest

from otupdate import buildroot, common

HERE = os.path.abspath(os.path.dirname(__file__))


@pytest.fixture
async def test_cli(aiohttp_client, loop, otupdate_config, monkeypatch):
    """
    Build an app using dummy versions, then build a test client and return it
    """
    app = buildroot.get_app(
        system_version_file=os.path.join(HERE, "version.json"),
        config_file_override=otupdate_config,
        name_override="opentrons-test",
        boot_id_override="dummy-boot-id-abc123",
        loop=loop,
    )
    client = await loop.create_task(aiohttp_client(app))
    return client


# This can be used to replace update_actions.RootPartitions elements as long
# as the callee doesn’t actually do identity checking
FakeRootPartElem = collections.namedtuple("FakeRootPartElem", ("name", "value"))


@pytest.fixture
def testing_partition(monkeypatch, tmpdir):
    partfile = os.path.join(tmpdir, "fake-partition")
    find_unused = mock.Mock()
    monkeypatch.setattr(buildroot.update_actions, "_find_unused_partition", find_unused)
    find_unused.return_value = FakeRootPartElem(
        "TWO", common.update_actions.Partition(2, partfile)
    )
    return partfile
