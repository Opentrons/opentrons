"""`loadAddressableArea` command request, result, and implementation models."""


from typing import Optional, Type
from typing_extensions import Literal
from pydantic import BaseModel, Field

from opentrons.protocol_engine.commands.command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
)


LoadAddressableAreaCommandType = Literal["loadAddressableArea"]


class LoadAddressableAreaParams(BaseModel):
    """Inform the system that this protocol will require a certain *addressable area*.

    An *addressable area* is an abstract representation of an add-on to the robot's deck.
    For example, if a Flex is set up with a waste chute, it will have additional addressable areas
    representing the opening of the waste chute, where tips and labware can be dropped.

    Different addressable areas can be used in different ways: load labware atop them,
    blow out liquid into them, and so on. The full list of addressable areas is defined by
    [our deck definitions](https://github.com/Opentrons/opentrons/tree/edge/shared-data/deck).

    Unlike hardware modules (see the `loadModule` command), addressable areas are passive.
    There are no electronics to control.

    When this command is executed, Protocol Engine will make sure the robot is physically set up
    such that the requested addressable area actually exists. For example, if you request
    the addressable area B4, it will make sure the robot is set up with a B3/B4 staging area slot.
    If that's not the case, the command will fail.

    This command is idempotent: loading the same addressable area multiple times is equivalent to
    loading it just once.
    """

    # This is deliberately typed as a plain `str`, instead of Enum or Literal, for two reasons:
    #
    # 1. robot-server database problems make it a bad idea to put Enums in Protocol Engine commands.
    #    https://opentrons.atlassian.net/browse/RSS-98
    # 2. We want shared-data to be the source of truth.
    #
    # The downside of this is that to use this command, you need to be familiar with deck
    # definitions. To make this better, we could perhaps autogenerate OpenAPI / JSON Schema spec
    # fragments from shared-data and inject them here.
    addressableAreaName: str = Field(
        description=(
            "The name of the addressable area that you want to use."
            " Valid values are the `id`s of `addressableArea`s in the"
            " [deck definition](https://github.com/Opentrons/opentrons/tree/edge/shared-data/deck)."
        )
    )


class LoadAddressableAreaResult(BaseModel):
    """The result of a `loadAddressableArea` command."""

    pass


class LoadAddressableAreaImplementation(  # noqa: D101
    AbstractCommandImpl[LoadAddressableAreaParams, LoadAddressableAreaResult]
):
    async def execute(
        self, params: LoadAddressableAreaParams
    ) -> LoadAddressableAreaResult:
        """Execute a `loadAddressableArea` command."""
        # TODO(mm, 2023-10-26): This needs to confirm that the requested addressable area
        # actually exists in the deck definition, and that it's compatible with everything
        # loaded so far.
        return LoadAddressableAreaResult()


class LoadAddressableArea(
    BaseCommand[LoadAddressableAreaParams, LoadAddressableAreaResult]
):
    """A `loadAddressableArea` command."""

    commandType: LoadAddressableAreaCommandType = "loadAddressableArea"
    params: LoadAddressableAreaParams
    result: Optional[LoadAddressableAreaResult]

    _ImplementationCls: Type[
        LoadAddressableAreaImplementation
    ] = LoadAddressableAreaImplementation


class LoadAddressableAreaCreate(BaseCommandCreate[LoadAddressableAreaParams]):
    """A creation request for a `loadAddressableArea` command."""

    commandType: LoadAddressableAreaCommandType = "loadAddressableArea"
    params: LoadAddressableAreaParams

    _CommandCls: Type[LoadAddressableArea] = LoadAddressableArea
