import enum
from opentrons.hardware_control import types


def test_create_aionotify_event():
    class FakeEnum(enum.Enum):
        CREATE = enum.auto()
        DELETE = enum.auto()
        MODIFY = enum.auto()

    enum_list = [FakeEnum.CREATE, FakeEnum.DELETE, FakeEnum.MODIFY]

    new_event = types.AionotifyEvent.build("fake event", enum_list)

    assert new_event.flags.CREATE
    assert new_event.flags.DELETE
    assert new_event.flags.MODIFY

    assert new_event.name == "fake event"
