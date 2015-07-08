"""
Theoretically, everything in this module should correspond to a real product
that can be purchased online, and use the industry standard name for that
product.

TODO: 

	Instead of:
		from labware import Pipette_P10, Microplate_96_deepwell
		[...]

	Just something like:
		from labware import Pipette, Microplate
		pipette = Pipette.get('p10')
		well = Microplate.get('96.deepwell')

	Where the standards stuff is filled in dynamically from standards.yml
	and the only thing that ever changes from one Pipette to another are
	standards-defined volumes and dimensions (and channels).

	In the meantime, standards.yml can feed a suite of tests that check 
	to ensure that every one of the instruments matches the set standard.

"""

class Labware():
	"""
	Labware is basically anything that you can put into a slot of the
	robot.  Whether or not it's actually a 'smart' module, it can respond
	to particular commands.

	For example, even though a Trash module is an empty plastic box, it still
	can respond to a 'dispose' command.
	"""
	
	def configure(self):
		"""
		TODO: Some sort of sane configuration mechanism that allows for
		      labware instances to define their required configuration
		      values, and then a mechanism that ensures this configuration
		      has taken place with all required values before the protocol
		      can be run.

		      Mostly because not configuring things will break the actual
		      robot.
		"""
		pass

class Pipette():

	channels = 1 

	def __init__(self):
		pass

	def configure(self, stop=None, drop=None, volume=None, side=None):
		if stop:
			self.stop = stop
		if drop:
			self.drop = drop
		if volume:
			self.volume = volume
		if side:
			self.side = side

	def transfer(start, end):
		pass

class Pipette_P10(Pipette):
	size     = 'P10'
	min_vol  =    0.5
	max_vol  =   10

class Pipette_P20(Pipette):
	size     = 'P20'
	min_vol  =    2
	max_vol  =   20

class Pipette_P200(Pipette):
	size     = 'P200'
	min_vol  =   20
	max_vol  =  200

class Pipette_P1000(Pipette):
	size     = 'P1000'
	min_vol  =  200
	max_vol  = 1000

class Tiprack(Labware):
	size = None

class Tiprack_P10(Tiprack):
	size = 'P10'

class Tiprack_P20(Tiprack):
	size = 'P20'

class Tiprack_P200(Tiprack):
	size = 'P200'

class Tiprack_P1000(Tiprack):
	size = 'P1000'

class Microplate(Labware):
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

	def __init__(self, parentDeck=None):
		self.parentDeck = parentDeck
		pass

	def calibrate(self, x=None, y=None, z=None):
		"""
		Coordinates should represent the center and near-bottom of well
		A1 with the pipette tip in place.
		"""
		self.start_x    = x
		self.start_y    = y
		self.transfer_z = z

	def get_well_position(self, position):
		""" Get a well based on a row, col string like "A1". """
		row, col = position
		row_num  = ord(row.upper())-65 # 65 = ANSI code for 'A'
		col_num  = int(col)-1 # We want it zero-indexed.
		offset_x = self.spacing*row_num
		offset_y = self.spacing*col_num
		return (offset_x+self.start_x, offset_y+self.start_y, self.transfer_z)

class Microplate_96(Microplate):
	pass

class Microplate_96_deepwell(Microplate_96):
	volume   = 400
	min_vol  =  50
	max_vol  = 380
	height   =  14.6
	depth    =  10.8

class Trash(Labware):
	pass