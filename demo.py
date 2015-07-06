from labware import Pipette_P10, Microplate_96_deepwell, Trash, Tiprack_P10
from protocol import Protocol

""" Alt syntax:
pipe = Pipette('p10')
wells = Microplate('96.deepwell')
"""

protocol = Protocol()

protocol.add_instrument(a=Pipette_P10())
protocol.set_modules(
	a1=Tiprack_P10(),
	a2=Microplate_96_deepwell(),
	a3=Trash()
)

well = protocol.get_module('a2')
pipe = protocol.get_instrument('a')

pipe.get_tip()
pipe.transfer(10, wells.well('a1'), wells.well('a2'))
pipe.trash_tip()

pipe.get_tip()
pipe.transfer(10, wells.row('2'), wells.row('3'), reuse_tip=True)
pipe.trash_tip()

""" Get tip and trash tip should be implicit. """
"""
TODO: It shouldn't be possible in theory to move the same amount of liquid
      into and out of an empty well because we need to remain within
      recommended working volumes.

      We're not currently worried about liquid volumes, though.  We're more
      concerned with the pipette properly navigating the deck.
"""
pipe.transfer(10, wells.row('3'), wells.row('2'), reuse_tip=True)

""" Get tip; transfer; trash tip """
pipe.transfer(10, wells.well('a2'), wells.well('a1'))

""" Get tip; transfer; trash tip """
pipe.transfer(10, wells.well('a1'), wells.well('a2'))