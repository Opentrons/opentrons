from typing import Optional, Generic, TypeVar

TEMPERATURE_ROOM = 23


ValueType = TypeVar('ValueType')


class OptionalValue(Generic[ValueType]):
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
