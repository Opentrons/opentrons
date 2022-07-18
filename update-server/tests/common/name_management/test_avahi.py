import pytest
from otupdate.common.name_management.avahi import (
    alternative_service_name,
    service_name_is_valid,
    SERVICE_NAME_MAXIMUM_OCTETS,
)


def test_alternative_service_name_sequencing() -> None:
    """It should sequence through incrementing integers.

    "BaseName" -> "BaseNameNum2" -> "BaseNameNum3" etc.
    """
    base_name = "BaseName"
    current_name = base_name
    for sequence_number in range(2, 150):
        current_name = alternative_service_name(current_name)
        assert current_name == f"{base_name}Num{sequence_number}"


@pytest.mark.parametrize(
    ("current_name", "expected_alternative_name"),
    [
        (
            # 63 ASCII bytes, exactly at the maximum.
            "123456789012345678901234567890123456789012345678901234567890123",
            #   59 bytes from the first 59 characters
            # +  4 bytes for the new "Num2" suffix
            # = 63 bytes total, exactly at the maximum.
            "12345678901234567890123456789012345678901234567890123456789Num2",
        ),
        (
            #   21 kanji
            # *  3 UTF-8 bytes per kanji
            # = 63 UTF-8 bytes, exactly at the maximum.
            "名名名名名名名名名名名名名名名名名名名名名",
            #   57 bytes from the first 19 kanji
            # +  4 bytes for the new "Num2" suffix
            # = 61 bytes total, just below the maximum of 63.
            #
            # It's correct for it to be below the maximum because an additional 3-byte
            # kanji code point would put us over the limit, and we shouldn't truncate
            # in the middle of a code point.
            "名名名名名名名名名名名名名名名名名名名Num2",
        ),
        (
            # 63 ASCII bytes, exactly at the maximum,
            # and no room left to increment the sequence number.
            # Pathological, but maybe someone "clever" set the name to this manually.
            "Num999999999999999999999999999999999999999999999999999999999999",
            # Rolled back to 0.
            # This is an arbitrary solution and it can change according to whatever's
            # easiest to implement.
            "Num0",
        ),
    ],
)
def test_alternative_service_name_truncation(
    current_name: str,
    expected_alternative_name: str,
) -> None:
    """When appending a sequence number, it should not let the name become too long."""
    alternative_name = alternative_service_name(current_name)
    assert alternative_name == expected_alternative_name
    assert len(alternative_name.encode("utf-8")) <= SERVICE_NAME_MAXIMUM_OCTETS


@pytest.mark.parametrize(
    ("service_name", "expected_is_valid"),
    [
        ("1, nothing wrong with me; 2, nothing wrong with me", True),
        # 63 ASCII bytes, exactly at the maximum.
        ("123456789012345678901234567890123456789012345678901234567890123", True),
        #   21 kanji
        # *  3 UTF-8 bytes per kanji
        # = 63 UTF-8 bytes, exactly at the maximum.
        ("名名名名名名名名名名名名名名名名名名名名名", True),
        # 64 ASCII bytes, just barely too long.
        ("1234567890123456789012345678901234567890123456789012345678901234", False),
        #   21 kanji
        # *  3 UTF-8 bytes per kanji
        # +  1 ASCII
        # = 64 UTF-8 bytes, just barely too long.
        ("名名名名名名名名名名名名名名名名名名名名名x", False),
        # Contains control characters, not valid.
        ("abc \n 123", False),
        ("abc \u0091 123", False),  # PRIVATE USE ONE, an arbitrary Unicode control char
        # Empty, not valid.
        ("", False),
    ],
)
def test_service_name_is_valid(service_name: str, expected_is_valid: bool) -> None:
    assert service_name_is_valid(service_name) == expected_is_valid
