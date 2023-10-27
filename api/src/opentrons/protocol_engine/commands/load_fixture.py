from typing import Optional, Type
from typing_extensions import Literal
from pydantic import BaseModel, Field

from opentrons.protocol_engine.commands.command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
)


LoadFixtureCommandType = Literal["loadFixture"]


class LoadFixtureParams(BaseModel):
    """Inform the system that this protocol expects to run with a *fixture* mounted to the robot.

    A *fixture* is a piece of modular hardware like a Flex Waste Chute or Flex Staging Area Slot.
    Unlike modules (see the `loadModule` command), fixtures are inert, with no electronics.

    Different fixtures provide different capabilities.
    """

    # These are deliberately typed as `str`s for two reasons:
    # 1. robot-server database problems make it a bad idea to put enums in Protocol Engine commands.
    # 2. We want shared-data to be the source of truth.
    #
    # The downside of this is that if you're creating these Protocol Engine commands,
    # you need to understand deck definitions. To make this better, we could perhaps autogenerate
    # OpenAPI / JSON Schema spec fragments from shared-data and inject them here.
    loadName: str = Field(
        description=(
            "What kind of fixture to load. The allowed values are the `id`s of"
            " `cutoutFixtures` in the deck definition."
        )
    )
    cutout: str = Field(
        description=(
            "Where to put this fixture."
            " The allowed values are the `id`s of `cutouts` in the deck definition."
        )
    )


class LoadFixtureResult(BaseModel):
    pass


class LoadFixtureImplementation(
    AbstractCommandImpl[LoadFixtureParams, LoadFixtureResult]
):
    async def execute(self, params: LoadFixtureParams) -> LoadFixtureResult:
        raise NotImplementedError


class LoadFixture(BaseCommand[LoadFixtureParams, LoadFixtureResult]):
    commandType: LoadFixtureCommandType = "loadFixture"
    params: LoadFixtureParams
    result: Optional[LoadFixtureResult]

    _ImplementationCls: Type[LoadFixtureImplementation] = LoadFixtureImplementation


class LoadFixtureCreate(BaseCommandCreate[LoadFixtureParams]):
    commandType: LoadFixtureCommandType = "loadFixture"
    params: LoadFixtureParams

    _CommandCls: Type[LoadFixture] = LoadFixture
