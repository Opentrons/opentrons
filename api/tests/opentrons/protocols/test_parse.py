import ast
import json
from textwrap import dedent
from typing import Any, Callable, Optional, Type, Union

import pytest

from opentrons.protocols.parse import (
    extract_static_python_info,
    _get_protocol_schema_version,
    validate_json,
    parse,
    API_VERSION_FOR_JSON_V5_AND_BELOW,
    MAX_SUPPORTED_JSON_SCHEMA_VERSION,
    version_from_static_python_info,
    JSONSchemaVersionTooNewError,
)
from opentrons.protocols.types import (
    JsonProtocol,
    Protocol,
    PythonProtocol,
    StaticPythonInfo,
    MalformedProtocolError,
    ApiDeprecationError,
)
from opentrons.protocols.api_support.types import APIVersion


@pytest.mark.parametrize(
    "protocol_source,expected_result",
    [
        (
            # Neither metadata nor requirements:
            "",
            StaticPythonInfo(metadata=None, requirements=None),
        ),
        (
            # Just metadata:
            """
            metadata = {
                'k1': 'v1',
                'k2': 'v2'
            }
            """,
            StaticPythonInfo(metadata={"k1": "v1", "k2": "v2"}, requirements=None),
        ),
        (
            # Just requirements:
            """
            requirements = {
                'k1': 'v1',
                'k2': 'v2'
            }
            """,
            StaticPythonInfo(metadata=None, requirements={"k1": "v1", "k2": "v2"}),
        ),
        (
            # Both:
            """
            metadata = {
                'mk1': 'mv1',
                'mk2': 'mv2'
            }
            requirements = {
                'rk1': 'rv1',
                'rk2': 'rv2'
            }
            """,
            StaticPythonInfo(
                metadata={"mk1": "mv1", "mk2": "mv2"},
                requirements={"rk1": "rv1", "rk2": "rv2"},
            ),
        ),
        (
            # Surrounded by other stuff:
            """
            this = 0
            that = 1
            metadata = {
                'mk1': 'mv1',
                'mk2': 'mv2'
            }
            requirements = {
                'rk1': 'rv1',
                'rk2': 'rv2'
            }
            print('wat?')
            metadata['hello'] = 'moon'
            fakedata['what?'] = 'ham'
            """,
            StaticPythonInfo(
                metadata={"mk1": "mv1", "mk2": "mv2"},
                requirements={"rk1": "rv1", "rk2": "rv2"},
            ),
        ),
        (
            # Later assignments should override earlier assignments:
            # TODO(mm, 2022-10-24): Reconsider whether we actually want this behavior.
            # Protocols probably shouldn't do this. Note that metadata["k"] = "v" is
            # unsupported.
            """
            metadata = {"k1": "v1"}
            metadata = {"k2": "v2"}
            """,
            StaticPythonInfo(metadata={"k2": "v2"}, requirements=None),
        ),
    ],
)
def test_extract_static_python_info(
    protocol_source: str, expected_result: StaticPythonInfo
) -> None:
    parsed = ast.parse(dedent(protocol_source), filename="testy", mode="exec")
    actual_result = extract_static_python_info(parsed)
    assert actual_result == expected_result


parse_version_cases = [
    (
        """
        from opentrons import instruments

        p = instruments.P10_Single(mount='right')
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
    (
        """
        from opentrons import instruments as instr

        p = instr.P10_Single(mount='right')
        """,
        APIVersion(1, 0),
    ),
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
          'apiLevel': '1'
          }

        def run(ctx):
            right = ctx.load_instrument('p300_single', types.Mount.RIGHT)
        """,
        APIVersion(1, 0),
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
        from opentrons import labware, instruments

        p = instruments.P10_Single(mount='right')
        """,
        APIVersion(1, 0),
    ),
    (
        """
        from opentrons import types, containers
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

        p = instr.P300_Single('right')
        """,
        APIVersion(1, 0),
    ),
]


@pytest.mark.parametrize("proto,version", parse_version_cases)
def test_parse_get_version(proto: str, version: APIVersion) -> None:
    proto = dedent(proto)
    if version == APIVersion(1, 0):
        with pytest.raises(ApiDeprecationError):
            parse(proto)
    else:
        parsed = parse(proto)
        assert parsed.api_level == version


@pytest.mark.parametrize(
    "static_info,expected_version",
    [
        # Basic extraction:
        (
            StaticPythonInfo(metadata={"apiLevel": "1"}, requirements=None),
            APIVersion(1, 0),
        ),
        (
            StaticPythonInfo(metadata={"apiLevel": "1.0"}, requirements=None),
            APIVersion(1, 0),
        ),
        (
            StaticPythonInfo(metadata={"apiLevel": "1.2"}, requirements=None),
            APIVersion(1, 2),
        ),
        (
            StaticPythonInfo(metadata={"apiLevel": "2.0"}, requirements=None),
            APIVersion(2, 0),
        ),
        (
            StaticPythonInfo(metadata={"apiLevel": "2.6"}, requirements=None),
            APIVersion(2, 6),
        ),
        (
            StaticPythonInfo(metadata={"apiLevel": "10.23123151"}, requirements=None),
            APIVersion(10, 23123151),
        ),
        # When one or both is missing:
        # TODO(mm, 2022-10-21): The expected behavior here is still to be decided.
        (
            StaticPythonInfo(metadata=None, requirements=None),
            None,
        ),
        (
            StaticPythonInfo(metadata=None, requirements={}),
            None,
        ),
        (
            StaticPythonInfo(metadata=None, requirements={"apiLevel": "123.456"}),
            APIVersion(123, 456),
        ),
        (
            StaticPythonInfo(metadata={}, requirements=None),
            None,
        ),
        (
            StaticPythonInfo(metadata={}, requirements={}),
            None,
        ),
        (
            StaticPythonInfo(metadata={}, requirements={"apiLevel": "123.456"}),
            APIVersion(123, 456),
        ),
        (
            StaticPythonInfo(metadata={"apiLevel": "123.456"}, requirements=None),
            APIVersion(123, 456),
        ),
        (
            StaticPythonInfo(metadata={"apiLevel": "123.456"}, requirements={}),
            APIVersion(123, 456),
        ),
        # Overriding:
        # TODO(mm, 2022-10-21): The expected behavior here is still to be decided.
        (
            StaticPythonInfo(
                metadata={"apiLevel": "123.456"}, requirements={"apiLevel": "789.0"}
            ),
            APIVersion(789, 0),
        ),
    ],
)
def test_version_from_static_python_info_valid(
    static_info: StaticPythonInfo, expected_version: APIVersion
) -> None:
    assert version_from_static_python_info(static_info) == expected_version


test_invalid_metadata = [
    (StaticPythonInfo(metadata={"apiLevel": "2"}, requirements=None), ValueError),
    (StaticPythonInfo(metadata={"apiLevel": "2.0.0"}, requirements=None), ValueError),
    (StaticPythonInfo(metadata={"apiLevel": "asda"}, requirements=None), ValueError),
]


@pytest.mark.parametrize("static_python_info,exc", test_invalid_metadata)
def test_version_from_static_python_info_invalid(
    static_python_info: StaticPythonInfo, exc: Type[Exception]
) -> None:
    with pytest.raises(exc):
        version_from_static_python_info(static_python_info)


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


@pytest.mark.parametrize("protocol_file", ["testosaur_v2.py"])
@pytest.mark.parametrize("protocol_text_kind", ["str", "bytes"])
@pytest.mark.parametrize("filename", ["real", "none"])
def test_parse_python_details(
    protocol: Protocol, protocol_text_kind: str, filename: str
) -> None:
    if protocol_text_kind == "bytes":
        text: Union[bytes, str] = protocol.text.encode("utf-8")
    else:
        text = protocol.text
    if filename == "real":
        fake_fname = protocol.filename
    else:
        fake_fname = None
    parsed = parse(text, fake_fname)
    assert isinstance(parsed, PythonProtocol)
    assert parsed.text == protocol.text
    assert isinstance(parsed.text, str)
    fname = fake_fname if fake_fname else "<protocol>"
    assert parsed.filename == fname
    assert parsed.api_level == APIVersion(2, 0)
    assert parsed.metadata == {
        "protocolName": "Testosaur",
        "author": "Opentrons <engineering@opentrons.com>",
        "description": 'A variant on "Dinosaur" for testing',
        "source": "Opentrons Repository",
        "apiLevel": "2.0",
    }
    assert parsed.contents == compile(protocol.text, filename=fname, mode="exec")


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
    "bad_protocol",
    [
        """
        metadata={"apiLevel": "2.0"}
        def run(ctx): pass
        def run(ctx): pass
        """,
        """
        metadata = {"apiLevel": "2.0"}

        print('hi')
        """,
        """
        metadata = {"apiLevel": "2.0"}
        def run(ctx):
          pass

        def run(blahblah):
          pass
        """,
    ],
)
def test_parse_bad_structure(bad_protocol: str) -> None:
    with pytest.raises(MalformedProtocolError):
        parse(dedent(bad_protocol))
