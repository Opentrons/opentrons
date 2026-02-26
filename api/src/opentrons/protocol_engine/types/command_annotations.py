"""Protocol Engine types dealing with command annotations."""

from typing import Any, Dict, List, Literal, Optional, Union

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class BaseCommandAnnotation(BaseModel):
    """Optional annotations for protocol engine commands."""

    annotationType: str = Field(
        ..., description="The type of annotation (for machine parsing)"
    )
    annotationId: str = Field(
        ..., description="A unique identifier for the command annotation."
    )


class CommandAnnotation(BaseModel):
    """Optional annotations for protocol engine commands."""

    id: str = Field(..., description="A unique identifier for the command annotation.")
    # TODO (spp, 2026-02-25): make this a string enum or string literal
    source: str = Field(..., description="The type of annotation (for machine parsing)")
    name: str = Field(..., description="The name of the annotation")
    description: Optional[str] = Field(
        None,
        description="An optional description for the annotation.",
    )
    params: Dict[str, Any] = (
        Field(  # maybe make this field optional if it's not going to be used in the near future?
            ...,
            description="Key value pairs of the parameters passed to the annotation.",
        )
    )
    parentId: Optional[str] = Field(
        None, description="The ID of the parent annotation if this is a sub-annotation."
    )


class BaseCommandAnnotationLegacy(BaseModel):
    """Legacy implementation for optional annotations for protocol engine commands."""

    commandKeys: List[str] = Field(
        ..., description="Command keys to which this annotation applies"
    )
    annotationType: str = Field(
        ..., description="The type of annotation (for machine parsing)"
    )


class SecondOrderCommandAnnotationLegacy(BaseCommandAnnotationLegacy):
    """Annotates a group of atomic commands which were the direct result of a second order command.

    Examples of second order commands would be transfer, consolidate, mix, etc.
    """

    annotationType: Literal["secondOrderCommand"] = "secondOrderCommand"
    params: Dict[str, Any] = Field(
        ...,
        description="Key value pairs of the parameters passed to the second order command that this annotates.",
    )
    machineReadableName: str = Field(
        ...,
        description="The name of the second order command in the form that the generating software refers to it",
    )
    userSpecifiedName: Optional[str] = Field(
        None, description="The optional user-specified name of the second order command"
    )
    userSpecifiedDescription: Optional[str] = Field(
        None,
        description="The optional user-specified description of the second order command",
    )


class CustomCommandAnnotationLegacy(BaseCommandAnnotationLegacy):
    """Annotates a group of atomic commands in some manner that Opentrons software does not anticipate or originate."""

    annotationType: Literal["custom"] = "custom"
    model_config = ConfigDict(extra="allow")


LegacyCommandAnnotation = Union[
    SecondOrderCommandAnnotationLegacy, CustomCommandAnnotationLegacy
]
