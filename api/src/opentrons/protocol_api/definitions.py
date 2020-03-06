import abc

from ..protocols import types

MAX_SUPPORTED_VERSION = types.APIVersion(2, 3)
#: The maximum supported protocol API version in this release

V2_MODULE_DEF_VERSION = types.APIVersion(2, 3)
#: The first API version in which we prefer the v2 module defs


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
