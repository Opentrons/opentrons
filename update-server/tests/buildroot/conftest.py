import collections
import os
from unittest import mock

import pytest

from otupdate import buildroot, common

HERE = os.path.abspath(os.path.dirname(__file__))

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
