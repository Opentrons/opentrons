class Deck():

	_slots = None # Keys are tuples of zero-index positions. A1 = (0, 0)

	def __init__(self, **kwargs):
		self._slots = {}
		self.add_modules(**kwargs)

	def add_modules(self, **kwargs):
		for position in kwargs:
			self.add_module(position, kwargs[position])
	
	def add_module(self, position, mod):
		pos = Deck._normalize_position(position)
		if pos not in self._slots:
			self._slots[pos] = mod
			mod.position = position
		else:
			raise Exception(
				"Can't overwrite existing slot {}/{}."\
				.format(position.upper(), pos)
			)

	def slot(self, position):
		pos = Deck._normalize_position(position)
		if pos not in self._slots:
			raise KeyError(
				"No deck module at slot {}/{}."\
				.format(position.upper(), pos)
			)
		return self._slots[pos]

	def configure(self, obj):
		calibration = obj['calibration']
		for pos in calibration:
			module = self.slot(pos)
			module.calibrate(**calibration[pos])

	@staticmethod
	def _normalize_position(position):
		row, col = position # 'A1' = ['A', '1']
		row_num  = ord(row.upper())-65 # 65 = ANSI code for 'A'
		col_num  = int(col)-1 # We want it zero-indexed.
		return (row_num, col_num)