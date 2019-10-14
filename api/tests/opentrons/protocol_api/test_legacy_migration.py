import pytest
import os
from unittest import mock
# from contextlib import enter_context

from opentrons.protocol_api import back_compat

@pytest.mark.apiv2_only
def test_migrated_labware_shape():

    return None


@pytest.mark.apiv2_only
def test_directory_save():
    return None


@pytest.mark.apiv2_only
def test_env_variable(monkeypatch):
    migration_mock = mock.Mock()
    monkeypatch.setattr(back_compat, 'perform_migration', migration_mock)
    monkeypatch.setenv('MIGRATE_V1_LABWARE', 1)
    # with enter_context:
    import opentrons
    assert migration_mock.called
    monkeypatch.delenv('MIGRATE_V1_LABWARE')
