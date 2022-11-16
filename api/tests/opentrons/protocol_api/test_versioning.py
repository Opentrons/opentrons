"""Tests for opentrons.protocol_api.versioning."""
import textwrap

import pytest

from opentrons.protocol_api.versioning import (
    APIVersion,
    APIVersionError,
    requires_version,
)


def test_requires_version() -> None:
    """The @requires_version decorator should wrap a method."""

    class _Subject:
        _api_version = APIVersion(2, 0)

        @requires_version(2, 0)
        def act(self) -> int:
            return 42

    subject = _Subject()
    result = subject.act()

    assert result == 42


def test_requires_version_too_low() -> None:
    """It should raise if the version is too low."""

    class _Subject:
        _api_version = APIVersion(2, 2)

        @requires_version(2, 3)
        def act(self) -> int:
            return 42

    subject = _Subject()

    with pytest.raises(APIVersionError):
        subject.act()


def test_requires_version_adds_to_docstring() -> None:
    """It should add the version added to the docstring."""

    class _Subject:
        _api_version = APIVersion(2, 2)

        @requires_version(2, 3)
        def act(self) -> int:
            """Act out."""
            return 42

    assert _Subject.act.__doc__ == textwrap.dedent(
        """Act out.

        .. versionadded:: 2.3

        """
    )
