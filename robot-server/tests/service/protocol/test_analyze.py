import pytest
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.types import PythonProtocol, JsonProtocol

from robot_server.service.protocol import models
from robot_server.service.protocol import analyze


def test__extract_metadata_none():
    """It returns empty metadata when passed None"""
    assert analyze._extract_metadata(None) == models.Meta(
        name=None, author=None, apiLevel=None
    )


def test__extract_metadata_python():
    """It returns complete metadata when passed PythonProtocol"""
    protocol = PythonProtocol(
        text="abc",
        api_level=APIVersion(major=2, minor=2),
        metadata={"author": "some author", "protocolName": "my protocol"},
        filename="",
        extra_labware={},
        contents="",
        bundled_labware={},
        bundled_data={},
        bundled_python={},
    )

    assert analyze._extract_metadata(protocol) == models.Meta(
        name="my protocol", author="some author", apiLevel="2.2"
    )


@pytest.mark.parametrize(
    argnames="metadata",
    argvalues=[
        {"author": "some author", "protocolName": "my protocol"},
        {"author": "some author", "protocol-name": "my protocol"},
    ],
)
def test__extract_metadata_json(metadata):
    """It returns complete metadata when passed JSONProtocol"""
    protocol = JsonProtocol(
        text="abc",
        api_level=APIVersion(major=2, minor=2),
        filename="",
        contents={},
        schema_version=2,
        metadata=metadata,
    )

    assert analyze._extract_metadata(protocol) == models.Meta(
        name="my protocol", author="some author", apiLevel="2.2"
    )


def test__extract_equipment_none():
    """It will return empty model if input is None"""
    r = analyze._extract_equipment(None)
    assert r == models.RequiredEquipment(modules=[], labware=[], pipettes=[])


def test__extract_equipment():
    """It will return full model from input"""
    r = analyze._extract_equipment(None)
    assert r == models.RequiredEquipment(modules=[], labware=[], pipettes=[])
