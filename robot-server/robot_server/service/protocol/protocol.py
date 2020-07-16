import typing
from datetime import datetime
from dataclasses import dataclass, field
from pathlib import Path


@dataclass(frozen=True)
class UploadedProtocolMeta:
    name: str
    protocolFile: Path
    directory: Path
    userFiles: typing.List[str] = field(default_factory=list)
    lastModifiedAt: datetime = field(default_factory=datetime.utcnow)
    createdAt: datetime = field(default_factory=datetime.utcnow)


class UploadedProtocol:
    def __init__(self):
        pass

    def add(self):
        pass

    def clean_up(self):
        pass

