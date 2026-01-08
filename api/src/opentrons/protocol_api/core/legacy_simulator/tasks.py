from datetime import datetime

from ..tasks import AbstractTaskCore


class LegacyTaskCore(AbstractTaskCore):
    def __init__(self, created_at: datetime) -> None:
        raise NotImplementedError("Legacy protocols do not implement tasks.")

    def get_created_at_timestamp(self) -> datetime:
        raise NotImplementedError("Legacy protocols do not implement tasks.")

    def is_done(self) -> bool:
        raise NotImplementedError("Legacy protocols do not implement tasks.")

    def is_started(self) -> bool:
        raise NotImplementedError("Legacy protocols do not implement tasks.")

    def get_finished_at_timestamp(self) -> datetime | None:
        raise NotImplementedError("Legacy protocols do not implement tasks.")
