import abc


class DeckItem(abc.ABC):
    @property
    @abc.abstractmethod
    def highest_z(self) -> float:
        ...

    @property
    @abc.abstractmethod
    def separate_calibration(self) -> bool:
        ...

    @property
    @abc.abstractmethod
    def load_name(self) -> str:
        ...
