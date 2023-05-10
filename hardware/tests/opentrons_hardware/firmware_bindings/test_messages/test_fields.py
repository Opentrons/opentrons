"""Fields tests."""
import pytest
from typing import Optional

from opentrons_hardware.firmware_bindings.messages import fields


@pytest.mark.parametrize(
    argnames=["value_bytes", "primary", "secondary", "tertiary", "revision"],
    argvalues=[
        # primary+secondary, no tertiary - normal
        [b"a1\x00\x00", "a", "1", None, "a1"],
        # no content for this field - normal for old bootloaders
        [b"", None, None, None, None],
        # all fields filled - rare but possible
        [b"a1.3", "a", "1", ".3", "a1"],
        # present tertiary but only one byte of it
        [b"a1\x003", "a", "1", "3", "a1"],
        [b"a13\x00", "a", "1", "3", "a1"],
        # primary but not secondary, secondary but not primary, should never happen
        [b"\x001\x00\x00", None, "1", None, None],
        [b"a\x00\x00\x00", "a", None, None, None],
        # garbled data (errors swallowed)
        [b"\xff\xff\x00\x00", None, None, None, None],
        # incomplete data (missing fields become None)
        [b"a1.", "a", "1", ".", "a1"],
        [b"a1", "a", "1", None, "a1"],
        [b"a", "a", None, None, None],
        [b"", None, None, None, None],
    ],
)
def test_revision_field(
    value_bytes: bytes,
    primary: Optional[str],
    secondary: Optional[str],
    tertiary: Optional[str],
    revision: Optional[str],
) -> None:
    """The revision field should be buildable with some elements missing."""
    parsed = fields.OptionalRevisionField.build(value_bytes)
    assert parsed.primary == primary
    assert parsed.secondary == secondary
    assert parsed.tertiary == tertiary
    assert parsed.revision == revision
