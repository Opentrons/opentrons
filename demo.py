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
pipe.transfer(10, wells.row('b'), wells.row('c'), reuse_tip=True)
pipe.trash_tip()

""" Get tip and trash tip should be implicit. """
pipe.transfer(10, wells.row('c'), wells.row('d'), reuse_tip=True)

""" Get tip; transfer; trash tip """
pipe.transfer(10, wells.well('a2'), wells.well('a1'))

""" Get tip; transfer; trash tip """
pipe.transfer(10, wells.well('a1'), wells.well('a2'))