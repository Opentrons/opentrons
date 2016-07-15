import unittest
from labsuite.protocol import Protocol


class ContextHandlerTest(unittest.TestCase):

    def setUp(self):
        self.protocol = Protocol()

    def test_transfer(self):
        """ Maintain well volumes during transfers. """
        self.protocol.add_container('A1', 'microplate.96')
        self.protocol.add_container('C1', 'tiprack.p200')
        self.protocol.add_instrument('A', 'p200')
        self.protocol.calibrate('A1', x=1, y=2, z=3)
        self.protocol.transfer('A1:A1', 'A1:A2', ul=100)
        self.protocol.transfer('A1:A2', 'A1:A3', ul=80)
        self.protocol._initialize_context()
        vol1 = self.protocol._context_handler.get_volume('A1:A2')
        self.assertEqual(vol1, 0)
        run = self.protocol.run()
        next(run)  # Yield to set progress.
        next(run)  # Run first command.
        vol2 = self.protocol._context_handler.get_volume('A1:A2')
        self.assertEqual(vol2, 100)
        next(run)  # Run second command.
        vol3 = self.protocol._context_handler.get_volume('A1:A3')
        self.assertEqual(vol3, 80)

    def test_find_instrument_by_volume(self):
        """ Find instrument by volume. """
        self.protocol.add_instrument('A', 'p10')
        i = self.protocol._context_handler.get_instrument(volume=6)
        self.assertEqual(i.supports_volume(6), True)
        j = self.protocol._context_handler.get_instrument(volume=50)
        self.assertEqual(j, None)
        self.protocol.add_instrument('B', 'p200')
        k = self.protocol._context_handler.get_instrument(volume=50)
        self.assertEqual(k.name, 'p200')
