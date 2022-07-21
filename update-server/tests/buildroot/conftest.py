import collections
import os
from unittest import mock

import pytest

from otupdate import buildroot, common

HERE = os.path.abspath(os.path.dirname(__file__))


@pytest.fixture
async def test_cli(
    aiohttp_client,
    otupdate_config,
    monkeypatch,
    version_file_path,
    mock_name_synchronizer,
):
    """
    Build an app using dummy versions, then build a test client and return it
    """
    app = buildroot.get_app(
        name_synchronizer=mock_name_synchronizer,
        system_version_file=version_file_path,
        config_file_override=otupdate_config,
        boot_id_override="dummy-boot-id-abc123",
    )
    client = await aiohttp_client(app)
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
