import unittest
from opentrons.util.singleton import Singleton


class SingletonTestCase(unittest.TestCase):

    class MyClass(object, metaclass=Singleton):
        pass

    def test_singleton(self):
        a = SingletonTestCase.MyClass()
        b = SingletonTestCase.MyClass()
        self.assertEqual(a, b)
