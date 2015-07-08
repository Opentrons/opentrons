from .deck import Deck

class ContainerGrid():
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

	position = None

	def __init__(self, parent_deck=None):
		self.parent_deck = parent_deck
		self._children = {}

	def calibrate(self, x=None, y=None, z=None, **kwargs):
		"""
		Coordinates should represent the center and near-bottom of well
		A1 with the pipette tip in place.
		"""
		self.start_x = x
		self.start_y = y
		self.start_z = z

	def get_child_coordinates(self, position):
		""" Get a well based on a row, col string like "A1". """
		row, col = Deck._normalize_position(position)
		offset_x = self.spacing*row
		offset_y = self.spacing*col
		print(self.start_x)
		print(self.start_y)
		print(self.start_z)
		return (offset_x+self.start_x, offset_y+self.start_y, self.start_z)

	def get_child(self, position):
		key = Deck._normalize_position(position)
		if key not in self._children:
			child = self.init_child(position)
			self._children[key] = child
		return self._children[key]

	def init_child(self, position):
		return Object()


class ContainerGridChild():

	parent   = None
	position = None

	def __init__(self, parent, position):
		self.parent = parent
		self.position = position

	def coordinates(self):
		return self.parent.get_child_coordinates(self.position)