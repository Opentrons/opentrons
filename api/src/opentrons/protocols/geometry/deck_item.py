import abc


class DeckItem(abc.ABC):

    @property  # type: ignore
    @abc.abstractmethod
    def highest_z(self):
        pass

    @highest_z.setter  # type: ignore
    @abc.abstractmethod
    def highest_z(self, new_z: float):
        pass

    @property  # type: ignore
    @abc.abstractmethod
    def separate_calibration(self) -> bool:
        pass

    @property  # type: ignore
    @abc.abstractmethod
    def load_name(self) -> str:
        pass
