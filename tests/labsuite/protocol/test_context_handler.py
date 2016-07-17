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

    def test_tip_coordinates(self):
        """ Return tip coordinates. """
        context = self.protocol._context_handler
        self.protocol.add_instrument('A', 'p200')
        self.protocol.add_instrument('B', 'p10')
        self.protocol.add_container('B1', 'tiprack.p200')
        self.protocol.calibrate('B1', axis="A", x=100, y=150, top=60)
        self.protocol.add_container('A1', 'tiprack.p10')
        self.protocol.calibrate('A1', axis="B", x=200, y=250, top=160)

        p200 = context.get_instrument(axis='A')
        p10 = context.get_instrument(axis='B')

        c1 = context.get_tip_coordinates(p200)
        self.assertEqual(c1, {'x': 100, 'y': 150, 'top': 60, 'bottom': 0})
        c2 = context.get_tip_coordinates(p200)  # Next tip.
        self.assertEqual(c2, {'x': 100, 'y': 159, 'top': 60, 'bottom': 0})

        c3 = context.get_tip_coordinates(p10)
        self.assertEqual(c3, {'x': 200, 'y': 250, 'top': 160, 'bottom': 0})
        c4 = context.get_tip_coordinates(p10)  # Next tip.
        self.assertEqual(c4, {'x': 200, 'y': 259, 'top': 160, 'bottom': 0})

    def test_tiprack_switch(self):
        """ Return second tiprack when first is used up. """
        context = self.protocol._context_handler
        self.protocol.add_instrument('A', 'p200')
        self.protocol.add_container('B1', 'tiprack.p200')
        self.protocol.calibrate('B1', axis="A", x=100, y=150, top=60)
        self.protocol.add_container('A1', 'tiprack.p200')
        self.protocol.calibrate('A1', axis="A", x=200, y=250, top=160)
        rack = context.find_container(name='tiprack.p200', has_tips=True)
        self.assertEqual([(0, 0)], rack.address)
        rack.set_tips_used(96)
        rack = context.find_container(name='tiprack.p200', has_tips=True)
        self.assertEqual([(1, 0)], rack.address)
