"""Definitions of data and interface shapes for notes."""
from typing import Union, Literal, Protocol, List
from pydantic import BaseModel, Field

NoteKind = Union[Literal["warning", "information"], str]


class CommandNote(BaseModel):
    """A note about a command's execution or dispatch."""

    noteKind: NoteKind = Field(
        ...,
        description="The kind of note this is. Only the literal possibilities should be"
        " relied upon programmatically.",
    )
    shortMessage: str = Field(
        ...,
        description="The accompanying human-readable short message (suitable for display in a single line)",
    )
    longMessage: str = Field(
        ...,
        description="A longer message that may contain newlines and formatting characters describing the note.",
    )
    source: str = Field(
        ..., description="An identifier for the party that created the note"
    )


class CommandNoteAdder(Protocol):
    """The shape of a function that something can use to add a command note."""

    def __call__(self, note: CommandNote) -> None:
        """When called, this function should add the passed Note to some list."""
        ...


class CommandNoteTracker(CommandNoteAdder, Protocol):
    """The shape of a class that can track notes."""

    def get_notes(self) -> List[CommandNote]:
        """When called, should return all notes previously added with __call__."""
        ...
