import os
import unittest

from server.helpers import get_assets


class HelpersTestCase(unittest.TestCase):

    def test_get_assets(self):
        root = os.path.dirname(
            os.path.dirname(
                os.path.realpath(__file__)
            )
        )
        self.assertTrue(len(get_assets(root, 'views', 'html')) > 0)
        self.assertTrue(len(get_assets(root, 'scripts', 'js')) > 0)

if __name__ == '__main__':
    unittest.main()
