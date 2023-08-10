import json
from textwrap import dedent
from typing import Any, Callable, Optional, Union

import pytest
from opentrons_shared_data.robot.dev_types import RobotType

from opentrons.protocols.parse import (
    _get_protocol_schema_version,
    validate_json,
    parse,
    API_VERSION_FOR_JSON_V5_AND_BELOW,
    MAX_SUPPORTED_JSON_SCHEMA_VERSION,
    JSONSchemaVersionTooNewError,
)
from opentrons.protocols.types import (
    JsonProtocol,
    Protocol,
    PythonProtocol,
    PythonProtocolMetadata,
    MalformedPythonProtocolError,
    ApiDeprecationError,
)
from opentrons.protocols.api_support.types import APIVersion


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
    # TODO(mm, 2022-10-21): The expected behavior here is still to be decided.
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
    (
        # Overriding:
        # TODO(mm, 2022-10-21): The expected behavior here is still to be decided.
        """
        metadata = {"apiLevel": "123.456"}
        requirements = {"apiLevel": "789.0"}
        def run(ctx): pass
        """,
        APIVersion(789, 0),
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


def test_get_protocol_schema_version() -> None:
    assert _get_protocol_schema_version({"protocol-schema": "1.0.0"}) == 1
    assert _get_protocol_schema_version({"protocol-schema": "2.0.0"}) == 2
    assert _get_protocol_schema_version({"schemaVersion": 123}) == 123

    # schemaVersion has precedence over legacy 'protocol-schema'
    assert (
        _get_protocol_schema_version({"protocol-schema": "2.0.0", "schemaVersion": 123})
        == 123
    )

    with pytest.raises(RuntimeError):
        _get_protocol_schema_version({"schemaVersion": None})
    with pytest.raises(RuntimeError):
        _get_protocol_schema_version({})
    with pytest.raises(RuntimeError):
        _get_protocol_schema_version({"protocol-schema": "1.2.3"})


def test_validate_json(
    get_json_protocol_fixture: Callable[..., Any],
    get_labware_fixture: Callable[..., Any],
) -> None:
    # valid data that has no schema should fail
    with pytest.raises(RuntimeError, match="deprecated"):
        validate_json({"protocol-schema": "1.0.0"})
    with pytest.raises(JSONSchemaVersionTooNewError):
        validate_json({"schemaVersion": str(MAX_SUPPORTED_JSON_SCHEMA_VERSION + 1)})
    labware = get_labware_fixture("fixture_12_trough_v2")
    with pytest.raises(RuntimeError, match="labware"):
        validate_json(labware)
    with pytest.raises(RuntimeError, match="corrupted"):
        validate_json({"schemaVersion": "3"})

    v3 = get_json_protocol_fixture("3", "testAllAtomicSingleV3")
    assert validate_json(v3)[0] == 3

    v4 = get_json_protocol_fixture("4", "testModulesProtocol")
    assert validate_json(v4)[0] == 4


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
                'apiLevel': '2.0'
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
                "apiLevel": "2.0",
            },
            APIVersion(2, 0),
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
    protocol_text_kind: str,
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
    assert parsed.text == protocol_source
    assert isinstance(parsed.text, str)

    fname = filename if filename is not None else "<protocol>"

    assert parsed.filename == fname

    assert parsed.api_level == expected_api_level
    assert expected_robot_type == expected_robot_type
    assert parsed.metadata == expected_metadata
    assert parsed.contents == compile(protocol_source, filename=fname, mode="exec")


@pytest.mark.parametrize(
    ("fixture_version", "fixture_name"),
    [
        ("3", "simple"),
        ("3", "testAllAtomicSingleV3"),
    ],
)
@pytest.mark.parametrize("protocol_text_kind", ["str", "bytes"])
@pytest.mark.parametrize("filename", ["real", "none"])
def test_parse_json_details(
    get_json_protocol_fixture: Callable[..., Any],
    fixture_version: str,
    fixture_name: str,
    protocol_text_kind: str,
    filename: str,
) -> None:
    protocol = get_json_protocol_fixture(
        fixture_version=fixture_version, fixture_name=fixture_name, decode=False
    )
    if protocol_text_kind == "text":
        protocol_text: Union[bytes, str] = protocol
    else:
        protocol_text = protocol.encode("utf-8")
    if filename == "real":
        fname: Optional[str] = "simple.json"
    else:
        fname = None
    parsed = parse(protocol_text, fname)
    assert isinstance(parsed, JsonProtocol)
    assert parsed.filename == fname
    assert parsed.contents == json.loads(protocol)
    assert parsed.metadata == parsed.contents["metadata"]
    assert parsed.schema_version == int(fixture_version)
    # TODO(IL, 2020-10-07): if schema v6 declares its own api_level,
    # then those v6 fixtures will need to be asserted differently
    assert parsed.api_level == API_VERSION_FOR_JSON_V5_AND_BELOW


def test_parse_bundle_details(get_bundle_fixture: Callable[..., Any]) -> None:
    fixture = get_bundle_fixture("simple_bundle")
    filename = fixture["filename"]

    parsed = parse(fixture["binary_zipfile"], filename)

    assert isinstance(parsed, PythonProtocol)
    assert parsed.filename == "protocol.ot2.py"
    assert parsed.bundled_labware == fixture["bundled_labware"]
    assert parsed.bundled_python == fixture["bundled_python"]
    assert parsed.bundled_data == fixture["bundled_data"]
    assert parsed.metadata == fixture["metadata"]
    assert parsed.api_level == APIVersion(2, 0)


@pytest.mark.parametrize("protocol_file", ["testosaur_v2.py"])
def test_parse_extra_contents(
    get_labware_fixture: Callable[..., Any], protocol_file: str, protocol: Protocol
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
    assert parsed.extra_labware == bundled_labware  # type: ignore[union-attr]
    assert parsed.bundled_data == extra_data  # type: ignore[union-attr]


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
