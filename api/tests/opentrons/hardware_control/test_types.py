import enum
from opentrons.hardware_control import types


def test_create_aionotify_event() -> None:
    class FakeEnum(enum.Enum):
        CREATE = enum.auto()
        DELETE = enum.auto()
        MODIFY = enum.auto()

    enum_list = [FakeEnum.CREATE, FakeEnum.DELETE, FakeEnum.MODIFY]

    new_event = types.AionotifyEvent.build("fake event", enum_list)  # type: ignore[arg-type]

    assert new_event.flags.CREATE  # type: ignore[attr-defined]
    assert new_event.flags.DELETE  # type: ignore[attr-defined]
    assert new_event.flags.MODIFY  # type: ignore[attr-defined]

    assert new_event.name == "fake event"
