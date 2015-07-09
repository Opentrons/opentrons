from .grid import GridContainer, GridItem


class TiprackSlot(GridItem):
	
	has_tip = True

	def get_tip(self):
		if self.has_tip:
			self.has_tip = False
			return True
		else:
			raise Exception(
				"No tip left in slot {} of tiprack"\
				.format(self.position)
			)

class Tiprack(GridContainer):

	size = None

	"""
	I'm not even sure there is a standard for spacing on
	tipracks. I'm just using the microplate spacing, and
	it works with the rack I have.
	"""
	spacing = 9

	child_class = TiprackSlot

	def slot(self, position):
		return self.get_child(position)

class Tiprack_P10(Tiprack):
	size = 'P10'

class Tiprack_P20(Tiprack):
	size = 'P20'

class Tiprack_P200(Tiprack):
	size = 'P200'

class Tiprack_P1000(Tiprack):
	size = 'P1000'