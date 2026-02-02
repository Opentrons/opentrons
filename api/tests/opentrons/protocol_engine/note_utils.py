"""Test utilities for dealing with notes."""

import re
from typing import Optional

from opentrons.protocol_engine.notes import CommandNote


class CommandNoteMatcher:
    """Decoy matcher for notes instances."""

    def __init__(
        self,
        matching_noteKind_regex: Optional[str] = None,
        matching_shortMessage_regex: Optional[str] = None,
        matching_longMessage_regex: Optional[str] = None,
        matching_source_regex: Optional[str] = None,
    ) -> None:
        """Build a CommandNoteMatcher. All provided arguments are checked with re.search."""
        self._matching_noteKind_regex = (
            re.compile(matching_noteKind_regex)
            if matching_noteKind_regex is not None
            else None
        )
        self._matching_shortMessage_regex = (
            re.compile(matching_shortMessage_regex)
            if matching_shortMessage_regex is not None
            else None
        )
        self._matching_longMessage_regex = (
            re.compile(matching_longMessage_regex)
            if matching_longMessage_regex is not None
            else None
        )
        self._matching_source_regex = (
            re.compile(matching_source_regex)
            if matching_source_regex is not None
            else None
        )

    def __eq__(self, other: object) -> bool:
        """Called by Decoy. returns True on a match, False otherwise."""
        if not isinstance(other, CommandNote):
            return False
        if (
            self._matching_noteKind_regex is not None
            and not self._matching_noteKind_regex.search(other.noteKind)
        ):
            return False
        if (
            self._matching_shortMessage_regex is not None
            and not self._matching_shortMessage_regex.search(other.shortMessage)
        ):
            return False
        if (
            self._matching_longMessage_regex is not None
            and not self._matching_longMessage_regex.search(other.longMessage)
        ):
            return False
        if (
            self._matching_source_regex is not None
            and not self._matching_source_regex.search(other.source)
        ):
            return False
        return True
