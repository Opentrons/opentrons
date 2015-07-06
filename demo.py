from labware import Pipette_P10, Microplate_96_deepwell, Trash, Tiprack_P10
from protocol import Protocol

pipette_a = Pipette_P10()
wells = Microplate_96_deepwell()

""" Alt syntax:
pipette_a = Pipette('p10')
wells = Microplate('96.deepwell')
"""

protocol = Protocol()

protocol.add_instrument(a=pipette_a)
protocol.set_modules(
	a1=wells,
	a2=Trash(),
	a3=Tiprack_P10()
)

pipette_a.get_tip()
pipette_a.transfer(wells.well('a1'), wells.well('a2'))
pipette_a.trash_tip()

pipette_a.get_tip()
pipette_a.transfer(wells.row('b'), wells.row('c'))
pipetta_a.trash_tip()