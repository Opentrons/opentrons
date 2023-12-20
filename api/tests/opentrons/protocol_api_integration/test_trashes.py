"""Tests for the APIs around waste chutes and trash bins."""


from opentrons import protocol_api, simulate

import contextlib
from typing import ContextManager, Optional, Type
from typing_extensions import Literal

import pytest


@pytest.mark.parametrize(
    ("version", "robot_type", "expected_trash_class"),
    [
        ("2.13", "OT-2", protocol_api.Labware),
        ("2.14", "OT-2", protocol_api.Labware),
        ("2.15", "OT-2", protocol_api.Labware),
        pytest.param(
            "2.15",
            "Flex",
            protocol_api.Labware,
            marks=pytest.mark.ot3_only,  # Simulating a Flex protocol requires a Flex hardware API.
        ),
        pytest.param(
            "2.16",
            "OT-2",
            protocol_api.TrashBin,
        ),
        pytest.param(
            "2.16",
            "Flex",
            None,
            marks=pytest.mark.ot3_only,  # Simulating a Flex protocol requires a Flex hardware API.
        ),
    ],
)
def test_fixed_trash_presence(
    robot_type: Literal["OT-2", "Flex"],
    version: str,
    expected_trash_class: Optional[Type[object]],
) -> None:
    """Test the presence of the fixed trash.

    Certain combinations of API version and robot type have a fixed trash.
    For those that do, ProtocolContext.fixed_trash and InstrumentContext.trash_container
    should point to it. The type of the object depends on the API version.
    """
    protocol = simulate.get_protocol_api(version=version, robot_type=robot_type)
    instrument = protocol.load_instrument(
        "p300_single_gen2" if robot_type == "OT-2" else "flex_1channel_50",
        mount="left",
    )

    if expected_trash_class is None:
        with pytest.raises(
            Exception,
            match="Fixed Trash is not supported on Flex protocols in API Version 2.16 and above.",
        ):
            protocol.fixed_trash
        with pytest.raises(Exception, match="No trash container has been defined"):
            instrument.trash_container

    else:
        assert isinstance(protocol.fixed_trash, expected_trash_class)
        assert instrument.trash_container is protocol.fixed_trash


@pytest.mark.ot3_only  # Simulating a Flex protocol requires a Flex hardware API.
def test_trash_search() -> None:
    """Test the automatic trash search for protocols without a fixed trash."""
    protocol = simulate.get_protocol_api(version="2.16", robot_type="Flex")
    instrument = protocol.load_instrument("flex_1channel_50", mount="left")

    # By default, there should be no trash.
    with pytest.raises(
        Exception,
        match="Fixed Trash is not supported on Flex protocols in API Version 2.16 and above.",
    ):
        protocol.fixed_trash
    with pytest.raises(Exception, match="No trash container has been defined"):
        instrument.trash_container

    loaded_first = protocol.load_trash_bin("A1")
    loaded_second = protocol.load_trash_bin("B1")

    # After loading some trashes, there should still be no protocol.fixed_trash...
    with pytest.raises(
        Exception,
        match="Fixed Trash is not supported on Flex protocols in API Version 2.16 and above.",
    ):
        protocol.fixed_trash
    # ...but instrument.trash_container should automatically update to point to
    # the first trash that we loaded.
    assert instrument.trash_container is loaded_first

    # You should be able to override instrument.trash_container explicitly.
    instrument.trash_container = loaded_second
    assert instrument.trash_container is loaded_second


@pytest.mark.parametrize(
    ("version", "robot_type", "expect_load_to_succeed"),
    [
        pytest.param(
            "2.13",
            "OT-2",
            False,
            # This xfail (the system does let you load a labware onto slot 12, and does not raise)
            # is surprising to me. It may be be a bug in old PAPI versions.
            marks=pytest.mark.xfail(strict=True, raises=pytest.fail.Exception),
        ),
        ("2.14", "OT-2", False),
        ("2.15", "OT-2", False),
        pytest.param(
            "2.15",
            "Flex",
            False,
            marks=pytest.mark.ot3_only,  # Simulating a Flex protocol requires a Flex hardware API.
        ),
        pytest.param(
            "2.16",
            "OT-2",
            False,
            # This should ideally raise, matching OT-2 behavior on prior Protocol API versions.
            # It currently does not because Protocol API v2.15's trashes are implemented as
            # addressable areas, not labware--and they're only brought into existence
            # *on first use,* not at the beginning of a protocol.
            #
            # The good news is that even though the conflicting load will not raise like we want,
            # something in the protocol will eventually raise, e.g. when a pipette goes to drop a
            # tip in the fixed trash and finds that a fixed trash can't exist there because there's
            # a labware.
            marks=pytest.mark.xfail(strict=True, raises=pytest.fail.Exception),
        ),
        pytest.param(
            "2.16",
            "Flex",
            True,
            marks=pytest.mark.ot3_only,  # Simulating a Flex protocol requires a Flex hardware API.
        ),
    ],
)
def test_fixed_trash_load_conflicts(
    robot_type: Literal["Flex", "OT-2"],
    version: str,
    expect_load_to_succeed: bool,
) -> None:
    """Test loading something onto the location historically used for the fixed trash.

    In configurations where there is a fixed trash, this should be disallowed.
    In configurations without a fixed trash, this should be allowed.
    """
    protocol = simulate.get_protocol_api(version=version, robot_type=robot_type)

    if expect_load_to_succeed:
        expected_error: ContextManager[object] = contextlib.nullcontext()
    else:
        expected_error = pytest.raises(
            Exception,
            # Exact message doesn't matter, as long as it's definitely a labware load conflict.
            match="LocationIsOccupiedError",
        )

    with expected_error:
        protocol.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", 12)
