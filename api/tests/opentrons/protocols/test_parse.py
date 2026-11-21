from textwrap import dedent
from typing import Any, Callable, Literal, Optional, Union

import pytest

from opentrons_shared_data.robot.types import RobotType

from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.parse import (
    PythonParseMode,
    parse,
)
from opentrons.protocols.types import (
    ApiDeprecationError,
    MalformedPythonProtocolError,
    PythonProtocol,
    PythonProtocolMetadata,
)

parse_version_cases = [
    # No explicitly-declared apiLevel (infer heuristically from APIv1 imports):
    (
        """
        from opentrons import types, containers
        """,
        APIVersion(1, 0),
    ),
    (
        """
        from opentrons import instruments

        p = instruments.P10_Single(mount='right')
        """,
        APIVersion(1, 0),
    ),
    (
        """
        from opentrons import labware, instruments

        p = instruments.P10_Single(mount='right')
        """,
        APIVersion(1, 0),
    ),
    (
        """
        from opentrons import types, instruments

        p = instruments.P10_Single(mount='right')
        """,
        APIVersion(1, 0),
    ),
    (
        """
        from opentrons import instruments as instr

        p = instr.P10_Single(mount='right')
        """,
        APIVersion(1, 0),
    ),
    (
        """
        import opentrons.instruments

        p = instruments.P10_Single(mount='right')
        """,
        APIVersion(1, 0),
    ),
    # Explicitly-declared APIv1:
    (
        """
        from opentrons import instruments

        metadata = {
          'apiLevel': '1'
          }

        p = instruments.P10_Single(mount='right')
        """,
        APIVersion(1, 0),
    ),
    (
        # Explicitly-declared APIv1 despite having an APIv2-style run(ctx) function.
        """
        from opentrons import types

        metadata = {
          'apiLevel': '1'
          }

        def run(ctx):
            right = ctx.load_instrument('p300_single', types.Mount.RIGHT)
        """,
        APIVersion(1, 0),
    ),
    (
        # apiLevel as major.minor, not just major.
        # APIv1 didn't have minor apiLevel versions, so nobody would have actually written this in
        # the APIv1 days, but we should make sure we don't choke on it.
        """
        metadata = {
          'apiLevel': '1.0'
        }

        p = instruments.P10_Single(mount='right')
        """,
        APIVersion(1, 0),
    ),
    (
        # apiLevel as major.minor, not just major.
        # APIv1 didn't have minor apiLevel versions, so nobody would have actually written this in
        # the APIv1 days, but we should make sure we don't choke on it.
        """
        metadata = {
          'apiLevel': '1.2'
        }

        p = instruments.P10_Single(mount='right')
        """,
        APIVersion(1, 2),
    ),
    # Explicitly-declared APIv2 or above:
    (
        """
        from opentrons import types

        metadata = {
            'apiLevel': '2.0'
        }

        def run(ctx):
            right = ctx.load_instrument('p300_single', types.Mount.RIGHT)
        """,
        APIVersion(2, 0),
    ),
    (
        """
        from opentrons import types

        metadata = {
          'apiLevel': '2.0'
          }

        def run(ctx):
            right = ctx.load_instrument('p300_single', types.Mount.RIGHT)
        """,
        APIVersion(2, 0),
    ),
    (
        """
        metadata = {'apiLevel': '2.6'}
        def run(ctx): pass
        """,
        APIVersion(2, 6),
    ),
    (
        """
        metadata = {'apiLevel': '10.23123151'}
        def run(ctx): pass
        """,
        APIVersion(10, 23123151),
    ),
    # Explicitly-declared apiLevel with various cases of it being in metadata or requirements:
    (
        """
        requirements = {"apiLevel": "123.456"}
        def run(ctx): pass
        """,
        APIVersion(123, 456),
    ),
    (
        """
        metadata = {}
        requirements = {"apiLevel": "123.456"}
        def run(ctx): pass
        """,
        APIVersion(123, 456),
    ),
    (
        """
        metadata = {"apiLevel": "123.456"}
        def run(ctx): pass
        """,
        APIVersion(123, 456),
    ),
    (
        """
        metadata = {"apiLevel": "123.456"}
        requirements = {}
        def run(ctx): pass
        """,
        APIVersion(123, 456),
    ),
]


@pytest.mark.parametrize("proto,version", parse_version_cases)
def test_parse_get_version(proto: str, version: APIVersion) -> None:
    proto = dedent(proto)
    if version < APIVersion(2, 0):
        with pytest.raises(ApiDeprecationError):
            parse(proto)
    else:
        parsed = parse(proto)
        assert parsed.api_level == version


@pytest.mark.parametrize(
    ("protocol_source", "expected_message"),
    [
        (
            """
            metadata = {"apiLevel": "2"}
            def run(cxt): pass
            """,
            "incorrectly formatted. It should be major.minor",
        ),
        (
            """
            metadata = {"apiLevel": "2.0.0"}
            def run(cxt): pass
            """,
            "incorrectly formatted. It should be major.minor",
        ),
        (
            """
            metadata = {"apiLevel": "asda"}
            def run(cxt): pass
            """,
            "incorrectly formatted. It should be major.minor",
        ),
    ],
)
def test_version_from_static_python_info_invalid(
    protocol_source: str, expected_message: str
) -> None:
    with pytest.raises(MalformedPythonProtocolError, match=expected_message):
        parse(dedent(protocol_source), "protocol.py")


@pytest.mark.parametrize(
    (
        "protocol_source",
        "expected_metadata",
        "expected_api_level",
        "expected_robot_type",
    ),
    [
        (
            # Basic APIv2 test with a bunch of stuff in metadata.
            """
            from opentrons import protocol_api, types

            metadata = {
                "protocolName": "Testosaur",
                "author": "Opentrons <engineering@opentrons.com>",
                "description": 'A variant on "Dinosaur" for testing',
                "source": "Opentrons Repository",
                "apiLevel": "2.0",
            }


            def run(ctx: protocol_api.ProtocolContext) -> None:
                ctx.home()
                tr = ctx.load_labware("opentrons_96_tiprack_1000ul", 1)
                right = ctx.load_instrument("p1000_single", types.Mount.RIGHT, [tr])
                lw = ctx.load_labware("corning_96_wellplate_360ul_flat", 2)
                right.pick_up_tip()
                right.aspirate(100, lw.wells()[0].bottom())
                right.dispense(100, lw.wells()[1].bottom())
                right.drop_tip(tr.wells()[-1].top())
            """,
            {
                "protocolName": "Testosaur",
                "author": "Opentrons <engineering@opentrons.com>",
                "description": 'A variant on "Dinosaur" for testing',
                "source": "Opentrons Repository",
                "apiLevel": "2.0",
            },
            APIVersion(2, 0),
            "OT-2 Standard",
        ),
        (
            # Both metadata and requirements, intermixed with a bunch of other statements.
            """
            this = 0
            that = 1
            metadata = {
                'mk1': 'mv1',
                'mk2': 'mv2',
                'apiLevel': '2.123'
            }
            print('wat?')
            def run(cxt): pass
            requirements = {
                'robotType': 'Flex'
            }
            metadata['hello'] = 'moon'
            fakedata['what?'] = 'ham'
            """,
            {
                "mk1": "mv1",
                "mk2": "mv2",
                "apiLevel": "2.123",
            },
            APIVersion(2, 123),
            "OT-3 Standard",
        ),
        (
            # Later assignments to metadata should override earlier ones.
            # TODO(mm, 2022-10-24): We're covering this with this test to retain current behavior,
            # but we should reconsider whether we actually want this behavior.
            # Protocols probably shouldn't do this. Note that metadata["k"] = "v" is
            # unsupported.
            """
            metadata = {'mk1': 'mv1'}
            metadata = {'mk2': 'mv2'}
            requirements = {'apiLevel': '2.0'}
            requirements = {'apiLevel': '2.1'}
            def run(cxt): pass
            """,
            {"mk2": "mv2"},
            APIVersion(2, 1),
            "OT-2 Standard",
        ),
        (
            # Explicitly-specified robotType.
            """
            requirements = {"apiLevel": "2.15", "robotType": "OT-2"}
            def run(ctx): pass
            """,
            None,
            APIVersion(2, 15),
            "OT-2 Standard",
        ),
        (
            # Explicitly-specified robotType.
            """
            requirements = {"apiLevel": "2.15", "robotType": "Flex"}
            def run(ctx): pass
            """,
            None,
            APIVersion(2, 15),
            "OT-3 Standard",
        ),
        (
            # Explicitly-specified robotType.
            """
            requirements = {"apiLevel": "2.15", "robotType": "OT-3"}
            def run(ctx): pass
            """,
            None,
            APIVersion(2, 15),
            "OT-3 Standard",
        ),
    ],
)
@pytest.mark.parametrize("protocol_text_kind", ["str", "bytes"])
@pytest.mark.parametrize("filename", ["protocol.py", None])
def test_parse_python_details(
    protocol_source: str,
    protocol_text_kind: Literal["str", "bytes"],
    filename: Optional[str],
    expected_api_level: APIVersion,
    expected_robot_type: RobotType,
    expected_metadata: PythonProtocolMetadata,
) -> None:
    protocol_source = dedent(protocol_source)

    if protocol_text_kind == "bytes":
        text: Union[bytes, str] = protocol_source.encode("utf-8")
    else:
        text = protocol_source

    parsed = parse(text, filename)

    assert isinstance(parsed, PythonProtocol)
    assert parsed.text == text
    if protocol_text_kind == "str":
        assert isinstance(parsed.text, str)
    else:
        assert isinstance(parsed.text, bytes)

    assert parsed.filename == filename
    assert parsed.contents.co_filename == (
        filename if filename is not None else "<protocol>"
    )

    assert parsed.api_level == expected_api_level
    assert expected_robot_type == expected_robot_type
    assert parsed.metadata == expected_metadata
    assert parsed.contents == compile(
        protocol_source,
        filename="<Python ignores this filename in this comparison>",
        mode="exec",
    )


def test_parse_bundle_details(get_bundle_fixture: Callable[..., Any]) -> None:
    fixture = get_bundle_fixture("simple_bundle")
    filename = fixture["filename"]

    parsed = parse(fixture["binary_zipfile"], filename)

    assert isinstance(parsed, PythonProtocol)
    assert parsed.filename == filename
    assert parsed.bundled_labware == fixture["bundled_labware"]
    assert parsed.bundled_python == fixture["bundled_python"]
    assert parsed.bundled_data == fixture["bundled_data"]
    assert parsed.metadata == fixture["metadata"]
    assert parsed.api_level == APIVersion(2, 0)


@pytest.mark.parametrize("protocol_file", ["testosaur_v2.py"])
def test_parse_extra_contents(
    get_labware_fixture: Callable[..., Any],
    protocol_file: str,
    protocol: PythonProtocol,
) -> None:
    fixture_96_plate = get_labware_fixture("fixture_96_plate")
    bundled_labware = {"fixture/fixture_96_plate/1": fixture_96_plate}
    extra_data = {"hi": b"there"}
    parsed = parse(
        protocol.text,
        "testosaur_v2.py",
        extra_labware=bundled_labware,
        extra_data=extra_data,
    )
    assert parsed.extra_labware == bundled_labware
    assert parsed.bundled_data == extra_data


@pytest.mark.parametrize(
    ("bad_protocol", "expected_message"),
    [
        # Bad Python syntax:
        (
            """
            metadata = {"apiLevel": "2.0"}
            def run(ctx)  # Missing ":".
                pass
            """,
            '(invalid syntax)|(Missing ":")',  # This error message depends on the Python version.
        ),
        # Bad Python Protocol API structure:
        (
            """
            metadata={"apiLevel": "2.0"}
            def run(ctx): pass
            def run(ctx): pass
            """,
            "More than one run function",
        ),
        (
            """
            metadata = {"apiLevel": "2.0"}

            print('hi')
            """,
            "No function 'run\\(ctx\\)'",  # This is a regex, so '\\' to escape '(' and ')' chars.
        ),
        (
            """
            metadata = {"apiLevel": "2.0"}
            def run(ctx):
              pass

            def run(blahblah):
              pass
            """,
            "More than one run function",
        ),
        # Various kinds of invalid metadata dict or apiLevel:
        (
            # metadata missing entirely.
            """
            def run():
                pass
            """,
            "apiLevel not declared",
        ),
        (
            # Metadata provided, but not as a dict.
            """
            metadata = "Hello"

            def run():
                pass
            """,
            "apiLevel not declared",
        ),
        (
            # apiLevel missing from metadata dict and requirements dict.
            """
            metadata = {"Hello": "World"}

            def run():
                pass
            """,
            "apiLevel not declared",
        ),
        (
            # Metadata not statically parsable.
            """
            metadata = {"apiLevel": "123" + ".456"}

            def run():
                pass
            """,
            "Could not read the contents of the metadata dict",
        ),
        (
            # apiLevel provided, but not as a string.
            """
            metadata = {"apiLevel": 123.456}

            def run():
                pass
            """,
            "must be strings",
        ),
        (
            # apiLevel provided, but not as a well formatted string.
            """
            metadata = {"apiLevel": "123*456"}

            def run():
                pass
            """,
            "is incorrectly formatted",
        ),
        (
            # robotType provided, but not a valid string.
            """
            metadata = {"apiLevel": "2.11"}
            requirements = {"robotType": "ot2"}

            def run():
                pass
            """,
            "robotType must be 'OT-2' or 'Flex', not 'ot2'.",
        ),
        (
            # robotType provided, but not a valid string.
            """
            metadata = {"apiLevel": "2.11"}
            requirements = {"robotType": "flex"}

            def run():
                pass
            """,
            "robotType must be 'OT-2' or 'Flex', not 'flex'.",
        ),
    ],
)
def test_parse_bad_structure(bad_protocol: str, expected_message: str) -> None:
    with pytest.raises(MalformedPythonProtocolError, match=expected_message):
        parse(dedent(bad_protocol))


# TODO(mm, 2023-08-10): When we remove python_parse_mode from parse(), remove this
# parametrization and merge these tests with the other metadata/requirements validation tests.
@pytest.mark.parametrize("python_parse_mode", PythonParseMode)
@pytest.mark.parametrize(
    ("questionable_protocol", "expected_message"),
    [
        (
            # apiLevel in both metadata and requirements.
            """
            metadata = {"apiLevel": "2.14"}
            requirements = {"apiLevel": "2.14"}
            def run(ctx): pass
            """,
            "You may only put apiLevel in the metadata dict or the requirements dict, not both.",
        ),
        (
            # apiLevel in both metadata and requirements.
            """
            metadata = {"apiLevel": "2.14"}
            requirements = {"apiLevel": ""}
            def run(ctx): pass
            """,
            "You may only put apiLevel in the metadata dict or the requirements dict, not both.",
        ),
        (
            # Unrecognized keys in requirements.
            """
            requirements = {
                "apiLevel": "2.15",
                "robotType": "Flex",
                "APILevel": "2.15",
                "RobotType": "Flex",
                "foo": "bar",
            }
            def run(ctx): pass
            """,
            "Unrecognized keys in requirements dict: 'APILevel', 'RobotType', 'foo'",
        ),
        (
            # apiLevel too old to support the Flex.
            """
            requirements = {"apiLevel": "2.13", "robotType": "Flex"}
            def run(ctx): pass
            """,
            "The Opentrons Flex only supports apiLevel 2.15 or newer.",
        ),
    ],
)
def test_errors_conditional_on_legacy_mode(
    questionable_protocol: str,
    python_parse_mode: PythonParseMode,
    expected_message: str,
) -> None:
    if python_parse_mode == PythonParseMode.ALLOW_LEGACY_METADATA_AND_REQUIREMENTS:
        # Should not raise:
        parse(dedent(questionable_protocol), python_parse_mode=python_parse_mode)
    else:
        with pytest.raises(MalformedPythonProtocolError, match=expected_message):
            parse(dedent(questionable_protocol), python_parse_mode=python_parse_mode)


# TODO(mm, 2023-08-10): Remove these tests when we remove python_parse_mode from parse().
# https://opentrons.atlassian.net/browse/RSS-306
@pytest.mark.parametrize(
    ("protocol_source", "expected_api_level"),
    [
        (
            """
            metadata = {"apiLevel": "2.15"}
            requirements = {"apiLevel": "2.14"}
            def run(ctx): pass
            """,
            APIVersion(2, 14),
        ),
        (
            """
            requirements = {"apiLevel": "2.14"}
            metadata = {"apiLevel": "2.15"}
            def run(ctx): pass
            """,
            APIVersion(2, 14),
        ),
    ],
)
def test_legacy_apilevel_override(
    protocol_source: str, expected_api_level: APIVersion
) -> None:
    """An apiLevel in requirements should override an apiLevel in metadata.

    This only matters with `PythonParseMode.ALLOW_LEGACY_METADATA_AND_REQUIREMENTS`.
    With stricter validation, it's impossible to put apiLevel in both dicts in the first place.
    """
    parsed = parse(
        dedent(protocol_source),
        python_parse_mode=PythonParseMode.ALLOW_LEGACY_METADATA_AND_REQUIREMENTS,
    )
    assert parsed.api_level == expected_api_level
