from .grid import GridContainer

class Deck(GridContainer):

	rows = 3
	cols = 5

	def __init__(self, **kwargs):
		super(Deck, self).__init__()
		self.add_modules(**kwargs)

	def add_modules(self, **kwargs):
		for position in kwargs:
			self.add_module(position, kwargs[position])
	
	def add_module(self, position, mod):
		pos = self._normalize_position(position)
		if pos not in self._children:
			self._children[pos] = mod
			mod.position = position
		else:
			raise Exception(
				"Module already allocated to slot: {}/{}."\
				.format(position.upper(), pos)
			)

	def slot(self, position):
		pos = self._normalize_position(position)
		if pos not in self._children:
			raise KeyError(
				"No deck module at slot {}/{}."\
				.format(position.upper(), pos)
			)
		return self._children[pos]

	def configure(self, obj):
		calibration = obj['calibration']
		for pos in calibration:
			module = self.slot(pos)
			module.calibrate(**calibration[pos])