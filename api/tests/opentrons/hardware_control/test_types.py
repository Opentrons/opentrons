import enum
from typing import List, cast

from opentrons.hardware_control import types


def test_create_aionotify_event() -> None:
    class FakeEnum(enum.Enum):
        CREATE = enum.auto()
        DELETE = enum.auto()
        MODIFY = enum.auto()

    enum_list: List[enum.Enum] = cast(
        List[enum.Enum], [FakeEnum.CREATE, FakeEnum.DELETE, FakeEnum.MODIFY]
    )

    new_event = types.AionotifyEvent.build("fake event", enum_list)

    assert hasattr(new_event.flags, "CREATE")
    assert hasattr(new_event.flags, "DELETE")
    assert hasattr(new_event.flags, "MODIFY")
    assert new_event.flags.CREATE
    assert new_event.flags.DELETE
    assert new_event.flags.MODIFY

    assert new_event.name == "fake event"
