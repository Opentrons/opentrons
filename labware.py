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