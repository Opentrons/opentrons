class LiquidContainer():

	max_volume = None
	min_working_volume = None
	max_working_volume = None

	""" 
	A dict containing the liquid key (a user-specified name) along with
	the amount of that particular liquid in this blend.
	"""
	_contents = None # {}

	def __init__(self, max=None, min_working=None, max_working=None, ml=False):
		""" Initialize and set working volumes. """
		"""
		I guess ideally, you'd have a subclass to define the working volumes
		of specific containers, but that would get really silly really fast.

		Better to just specify that on the container because that's how the
		standards and defined and (as far as I know) they end up being uniform
		for all wells.

		If the rare situation where this isn't the case, you can just subclass
		this.
		"""
		self._contents = {}
		if max:
			self.max_volume = self.convert_ml(max, ml)
		if min_working:
			self.min_working_volume = self.convert_ml(min_working, ml)
		if max_working:
			self.max_working_volume = self.convert_ml(max_working, ml)

	def add_liquid(self, ml=False, **kwargs):
		"""
		You provide as keyword arguments liquid names and volumes in
		microliters.

		If you want it in milliliters, you can set ml=True in the
		kwargs.

		400ul of water:
		
			container.add_liquid(water=400) 

		400ml of water:

			container.add_liquid(water=400, ml=True)

		TODO: Attach to a global ingredients list to ensure that all
		      specified liquids have been defined.  For now, just
		      be careful.
		"""
		
		# Tally up the new liquids to make sure we can fit them into
		# the container.
		new_liquid = 0
		for liquid in kwargs:
			new_liquid = new_liquid + kwargs[liquid]

		new_liquid = self.convert_ml(new_liquid, ml)

		self.check_capacity(new_liquid)

		# check_capacity will raise an error if the value is out of
		# bounds, so now we can add our liquids.
		for liquid in kwargs:
			vol = self.convert_ml(kwargs[liquid])
			if liquid in self._contents:
				self._contents[liquid] = self._contents[liquid]+vol
			else:
				self._contents[liquid] = vol

	def remove_liquid(self, amount, ml=False):
		amount = self.convert_ml(amount, ml)
		self.check_capacity(amount*-1)


	def check_capacity(self, new_amount, ml=False):
		if not self.max_volume:
			return
		new_value = self.calculate_total_volume()+new_amount
		if (new_value > self.max_volume):
			raise VolumeError(
				"Liquid amount ({}{}l) exceeds max volume ({}{}l)."\
				.format(new_value, u'\u03BC', self.max_volume, u'\u03BC')
			)

	def calculate_total_volume(self, data=None):
		total = 0
		liqs = data or self._contents
		for l in liqs:
			total = total + liqs[l]
		return total

	def convert_ml(self, volume, ml=False):
		"""
		Simple utility method to allow input of ul volume and multiply by
		a thousand if ml is set to True.

		Python doesn't support passing by reference. ;_;
		"""
		if ml:
			return volume*1000 # OMG metric <3 <3
		else:
			return volume

	def get_volume(self, key):
		"""
		Returns the volume (ul) of a particular liquid by name.
		"""
		if key in self._contents:
			return self._contents[key]
		else:
			return None

	def transfer(self, amount, destination, ml=False):	
		amount = self.convert_ml(amount, ml)

		# Let's ensure there's room in the destination well first.
		# This should throw an exception, so no need to worry about
		# an if statement or anything fancy like that.
		destination.check_capacity(amount)

		# Make sure we have enough total volume to proceed with the
		# request. (Don't worry about working volumes for now.)
		total_volume = self.calculate_total_volume()
		if (total_volume<amount):
			raise ValueError(
				"Not enough liquid ({}{}l) for transfer ({}{}l)."\
				.format(total_volume, u'\u03BC', amount, u'\u03BC')
			)

		# Proportion math.
		mix = {}
		liq = self._contents
		for l in liq:
			proportion = liq[l]/total_volume
			value      = proportion*amount 
			# TODO: alternate add_liquid syntax for dynamic things like this.
			kwargs     = {}
			kwargs[l]  = value
			self._contents[l] = self._contents[l]-value
			destination.add_liquid(**kwargs)

class VolumeError(ValueError):
	pass