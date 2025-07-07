"""Tests for opentrons.protocol_api.core.core_map.LoadedCoreMap."""

import pytest
from decoy import Decoy

from opentrons.protocol_api import Labware, MagneticModuleContext
from opentrons.protocol_api.core.common import LabwareCore, ModuleCore
from opentrons.protocol_api.core.core_map import LoadedCoreMap


def test_get_nothing() -> None:
    """If you ask for nothing, you get nothing."""
    subject = LoadedCoreMap()
    assert subject.get(None) is None


def test_add_labware(decoy: Decoy) -> None:
    """It should be able to add labwares to the map."""
    labware_core = decoy.mock(cls=LabwareCore)
    other_labware_core = decoy.mock(cls=LabwareCore)
    labware = decoy.mock(cls=Labware)

    subject = LoadedCoreMap()
    subject.add(labware_core, labware)

    assert subject.get(labware_core) is labware

    with pytest.raises(KeyError):
        subject.get(other_labware_core)


def test_add_module(decoy: Decoy) -> None:
    """It should be able to add modules to the map."""
    module_core = decoy.mock(cls=ModuleCore)
    other_module_core = decoy.mock(cls=ModuleCore)
    module = decoy.mock(cls=MagneticModuleContext)

    subject = LoadedCoreMap()
    subject.add(module_core, module)

    assert subject.get(module_core) is module

    with pytest.raises(KeyError):
        subject.get(other_module_core)


def test_get_or_add_labware_builds(decoy: Decoy) -> None:
    """It should be able to get-with-default-adder and build the labware if it's missing."""
    labware_core = decoy.mock(cls=LabwareCore)
    labware = decoy.mock(cls=Labware)

    subject = LoadedCoreMap()
    assert subject.get_or_add(labware_core, lambda lw: labware) == labware


def test_get_or_add_labware_caches(decoy: Decoy) -> None:
    """It should be able to get-with-default-adder and return the labware if it's known."""
    labware_core = decoy.mock(cls=LabwareCore)
    labware = decoy.mock(cls=Labware)
    builder = decoy.mock(name="builder")
    subject = LoadedCoreMap()
    subject.add(labware_core, labware)
    assert subject.get_or_add(labware_core, builder) == labware
    decoy.verify(builder(labware_core), times=0)
