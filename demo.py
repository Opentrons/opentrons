from labware import Pipette_P10, Microplate_96_deepwell, Trash, Tiprack_P10
from protocol import Protocol

pipette_a = Pipette_P10()
wells = Microplate_96_deepwell()

protocol = Protocol()

protocol.set_modules(
	a1=pipette_a,
	a2=wells,
	a3=Trash(),
	a4=Tiprack_P10()
)

pipette_a.get_tip()
pipette_a.transfer(wells.well('a1'), wells.well('a2'))
pipette_a.trash_tip()

pipette_a.get_tip()
pipette_a.transfer(wells.row('b'), wells.row('c'))
pipetta_a.trash_tip()