from typing import List
from pydantic import BaseModel
from opentrons.protocol_engine import Command


class CommandList(BaseModel):
    """A Pydantic model for a list of Protocol Engine commands.

    This is intended to be equivalent to `List[Command]`.
    When converting to and from JSON via `.json()` and `.parse_raw()`,
    this will correspond to a JSON list, like:

        [{"commandType": "home":, ...}, {"commandType": "aspirate", ...}]

    This is a kludgey replacement for `List[Command]` to help with some database stuff:

      * Although we can do `pydantic.parse_raw_as(List[Command], json_str)` to parse
        JSON into a `List[Command]`, it's unclear how to go the other way, because
        `List[Command]` doesn't have a `.json()` method like normal Pydantic models.

      * One of our database columns is a list of commands stored via `PydanticJSON`.
        Using this class for that column instead of `List[Command]` simplifies
        the implementation of `PydanticJSON` and lets it provide better error-checking.
    """

    __root__: List[Command]
