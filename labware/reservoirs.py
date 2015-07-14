from .grid import GridContainer
from .liquids import LiquidWell

class Reservoir(GridContainer):

	rows = 1
	cols = 12
	spacing = .1 # TODO: Look this up.
	min_vol = 500
	max_vol = 21*1000
	volume  = 21*1000
	length  = 127.76
	width   =  85.47

	child_class = LiquidWell

	def col(self, col):
		position = 'A{}'.format(col)
		return self.get_child(position)