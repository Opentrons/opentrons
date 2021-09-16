from abc import ABC, abstractmethod

from opentrons import ThreadManager


class HTTPBase(ABC):

    @staticmethod
    @abstractmethod
    def main(hardware: ThreadManager):
        ...
