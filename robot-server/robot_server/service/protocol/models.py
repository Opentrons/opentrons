import typing
from datetime import datetime

from pydantic import BaseModel


class ProtocolResponse(BaseModel):
    name: str
    protocol_file: str
    labware_files: typing.List[str]
    user_files: typing.List[str]
    last_modified_at: datetime
    created_at: datetime
