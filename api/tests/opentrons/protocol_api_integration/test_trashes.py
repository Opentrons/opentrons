from opentrons import protocol_api, simulate

from typing import Optional, Type
from typing_extensions import Literal

import pytest


@pytest.mark.parametrize(
    ("version", "robot_type", "expected_trash_class"),
    [
        ("2.13", "OT-2", protocol_api.Labware),
        ("2.14", "OT-2", protocol_api.Labware),
        ("2.15", "OT-2", protocol_api.Labware),
        ("2.15", "Flex", protocol_api.Labware),
        pytest.param(
            "2.16",
            "OT-2",
            protocol_api.TrashBin,
            marks=pytest.mark.xfail(
                strict=True, reason="https://opentrons.atlassian.net/browse/RSS-417"
            ),
        ),
        ("2.16", "Flex", None),
    ],
)
def test_fixed_trash_return_type(
    robot_type: Literal["OT-2", "Flex"],
    version: str,
    expected_trash_class: Optional[Type[object]],
) -> None:
    """The return type of ProtocolContext.fixed_trash varies depending on API version."""
    protocol = simulate.get_protocol_api(version=version, robot_type=robot_type)

    if expected_trash_class is None:
        with pytest.raises(Exception, match="No trash container has been defined"):
            protocol.fixed_trash
    else:
        assert isinstance(protocol.fixed_trash, expected_trash_class)


@pytest.mark.parametrize(
    ("version", "robot_type"),
    [
        ("2.13", "OT-2"),
        ("2.14", "OT-2"),
        ("2.15", "OT-2"),
        ("2.15", "Flex"),
        pytest.param(
            "2.16",
            "OT-2",
            marks=pytest.mark.xfail(
                strict=True, reason="https://opentrons.atlassian.net/browse/RSS-417"
            ),
        ),
    ],
)
def test_default_instrument_trash_container_is_fixed_trash(
    robot_type: Literal["OT-2", "Flex"], version: str
) -> None:
    """When ProtocolContext.fixed_trash exists, InstrumentContext.trash_container should
    match it by default."""
    protocol = simulate.get_protocol_api(version=version, robot_type=robot_type)

    instrument = protocol.load_instrument(
        "p300_single_gen2" if robot_type == "OT-2" else "flex_1channel_50",
        mount="left",
    )

    assert instrument.trash_container is protocol.fixed_trash


def test_default_instrument_trash_container_does_not_exist() -> None:
    """Flex protocols with API version ≥2.16 have no fixed trash--so, no default
    InstrumentContext.trash_container either."""
    protocol = simulate.get_protocol_api(version="2.16", robot_type="Flex")
    instrument = protocol.load_instrument("flex_1channel_50", mount="left")

    with pytest.raises(Exception, match="No trash container has been defined"):
        instrument.trash_container


def test_trash_search() -> None:
    """Test the automatic trash search behavior for protocols without a fixed trash."""
    protocol = simulate.get_protocol_api(version="2.16", robot_type="Flex")
    instrument = protocol.load_instrument("flex_1channel_50", mount="left")

    # By default, there will be no trash.
    with pytest.raises(Exception, match="No trash container has been defined"):
        protocol.fixed_trash
    with pytest.raises(Exception, match="No trash container has been defined"):
        instrument.trash_container

    loaded_first = protocol.load_trash_bin("A1")
    loaded_second = protocol.load_trash_bin("B1")

    # After loading some trashes, there is still no protocol.fixed_trash...
    with pytest.raises(Exception, match="No trash container has been defined"):
        protocol.fixed_trash
    # ...but instrument.trash_container automatically updates to be the first trash we loaded.
    assert instrument.trash_container is loaded_first

    # You can override instrument.trash_container explicitly.
    instrument.trash_container = loaded_second
    assert instrument.trash_container is loaded_second
