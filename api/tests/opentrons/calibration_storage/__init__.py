import typing
from json import JSONDecoder
from pydantic import BaseModel
from pathlib import Path

READ_FUNC_TYPE = typing.Callable[[Path], typing.Dict[str, typing.Any]]
SAVE_FUNC_TYPE = typing.Callable[[Path, str, typing.Union[BaseModel, typing.Dict[str, typing.Any]]], typing.Any]
DELETE_FUNC_TYPE = typing.Callable[[Path], None]
MOCK_UTC = typing.Callable[[], None]
