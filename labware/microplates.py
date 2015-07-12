from .grid import GridContainer, GridItem
from .liquids import LiquidContainer

class MicroplateWell(GridItem):

	_liquid = None
	
	def __init__(self, *args, **kwargs):
		super(MicroplateWell, self).__init__(*args, **kwargs)
		p = self.parent
		self._liquid = LiquidContainer(
			max=p.volume, min_working=p.min_vol, max_working=p.max_vol
		)

	def allocate(self, **kwargs):
		self._liquid.add_liquid(**kwargs)

	def add_liquid(self, **kwargs):
		self._liquid.add_liquid(**kwargs)

	def get_volume(self):
		return self._liquid.get_volume()

	def get_proportion(self, liquid):
		return self._liquid.get_proportion(liquid)

	def transfer(self, amount, destination, ml=False):
		return self._liquid.transfer(amount, destination, ml=ml)

	def assert_capacity(self, amount, ml=False):
		return self._liquid.assert_capacity(amount, ml=ml)

class Microplate(GridContainer):
	rows     =   8
	cols     =  12
	volume   = 100
	min_vol  =  50
	max_vol  =  90
	height   =  14.45
	length   = 127.76
	width    =  85.47
	diameter =   7.15
	depth    =   3.25
	a1_x     =  14.38
	a1_y     =  11.24
	spacing  =   9

	child_class = MicroplateWell

	def well(self, position):
		return self.get_child(position)

	def calibrate(self, **kwargs):
		"""
		Coordinates should represent the center and near-bottom of well
		A1 with the pipette tip in place.
		"""
		super(Microplate, self).calibrate(**kwargs)

class Microplate_96(Microplate):
	pass

class Microplate_96_deepwell(Microplate_96):
	volume   = 400
	min_vol  =  50
	max_vol  = 380
	height   =  14.6
	depth    =  10.8