class GridItem():

	parent   = None
	position = None

	def __init__(self, parent, position):
		self.parent = parent
		self.position = position

	def coordinates(self):
		return self.parent.get_child_coordinates(self.position)

class GridContainer():

	"""
	Change these in child implementations if you want to constrain to an
	actual grid.  Good for making sure people don't try to navigate to 
	row 9999 and go way out of bounds.
	"""
	rows = None
	cols = None

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
		row = position[0].upper()
		col = position[1:]
		row_num  = ord(row)-ord('A')
		col_num  = int(col)-1 # We want it zero-indexed.
		if self.rows is None:
			raise Exception("No maximum row provided.")
		if self.cols is None:
			raise Exception("No maximum cols provided.")
		if self.rows and row_num > self.rows-1:
			raise ValueError(
				"Row {} out of range.".format(row)
			)
		if self.cols and col_num > self.cols-1:
			raise ValueError(
				"Column #{} out of range.".format(col)
			)
		return (row_num, col_num)