class GridItem():

	parent   = None
	position = None

	def __init__(self, parent, position):
		self.parent = parent
		self.position = position

	def coordinates(self):
		return self.parent.get_child_coordinates(self.position)

class GridContainer():
	rows = 0
	cols = 0
	spacing = 0

	"""
	Calibration.
	"""
	start_x = 0
	start_y = 0
	start_z = 0

	"""
	A dict containing tuples of zero-indexed child coordinates.
	We only initialize them when they're accessed because until then, there's
	no way to mutate their (non-existent) state.
	"""
	_children = None #{}

	child_class = GridItem

	def __init__(self, parent=None, **kwargs):
		self.parent = parent
		self._children = {}

	def calibrate(self, x=None, y=None, z=None, **kwargs):
		"""
		Generic calibration mechanism. It would be a good idea to override
		this in child classes just to provide better documentation about
		where the calibration point for a particular module should be.
		"""
		self.start_x = x
		self.start_y = y
		self.start_z = z

	def get_child_coordinates(self, position):
		""" Get a well based on a row, col string like "A1". """
		row, col = self._normalize_position(position)
		offset_x = self.spacing*row
		offset_y = self.spacing*col
		print(self.start_x)
		print(self.start_y)
		print(self.start_z)
		return (offset_x+self.start_x, offset_y+self.start_y, self.start_z)

	def get_child(self, position):
		key = self._normalize_position(position)
		if key not in self._children:
			child = self.init_child(position)
			self._children[key] = child
		return self._children[key]

	def init_child(self, position):
		return self.child_class(self, position)

	def _normalize_position(self, position):
		""" Don't use this; it's not part of the public API. """
		row, col = position # 'A1' = ['A', '1']
		row_num  = ord(row.upper())-65 # 65 = ANSI code for 'A'
		col_num  = int(col)-1 # We want it zero-indexed.
		return (row_num, col_num)