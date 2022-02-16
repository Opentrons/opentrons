# TODO(mc, 2020-10-22): use MountType implementation for Mount
class Mount(enum.Enum):
    LEFT = enum.auto()
    RIGHT = enum.auto()

    def __str__(self):
        return self.name

    @classmethod
    def string_to_mount(cls, mount: str) -> "Mount":
        if mount == "right":
            return cls.RIGHT
        else:
            return cls.LEFT


class MountType(str, enum.Enum):
    LEFT = "left"
    RIGHT = "right"

    def other_mount(self) -> MountType:
        return MountType.LEFT if self is MountType.RIGHT else MountType.RIGHT

    def to_hw_mount(self) -> Mount:
        return Mount.LEFT if self is MountType.LEFT else Mount.RIGHT
