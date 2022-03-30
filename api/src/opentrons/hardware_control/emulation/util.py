from typing import Optional, Generic, TypeVar

TEMPERATURE_ROOM = 23


ValueType = TypeVar("ValueType")


class OptionalValue(Generic[ValueType]):
    """
    A class that serializes optional values.

    Modules represent a null value as 'none'. For example this response from
    the thermocycler means the hold time is not set:
        H:none T:1.23
    """

    _value: Optional[ValueType]

    def __init__(self, value: Optional[ValueType] = None):
        self._value = value

    @property
    def val(self) -> Optional[ValueType]:
        return self._value

    @val.setter
    def val(self, value: Optional[ValueType]) -> None:
        self._value = value

    def __repr__(self) -> str:
        return "none" if self._value is None else str(self._value)

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, OptionalValue):
            return False

        return other.val == self.val
