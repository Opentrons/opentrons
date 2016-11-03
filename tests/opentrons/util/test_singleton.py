import unittest
from opentrons.util.singleton import Singleton


class SingletonCase(unittest.TestCase):

    class MyClass(object, metaclass=Singleton):
        pass

    def test_singleton(self):
        a = SingletonCase.MyClass()
        b = SingletonCase.MyClass()
        self.assertEqual(a, b)
