from labsuite.labware.grid import GridItem


class LiquidInventory():

    """
    This is the generic class for a mixture of liquids.  Each well and trough
    and such contains a LiquidInventory, which it uses to keep track of liquid
    inventory.
    """

    max_volume = None
    min_working_volume = None
    max_working_volume = None

    _allow_liquid_debt = False

    """
    A dict containing the liquid key (a user-specified name) along with
    the amount of that particular liquid in this blend.
    """
    _contents = None  # {}

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

    @property
    def allow_liquid_debt(self):
        """
        Whether or not to allow for negative liquid values.

        The easiest way to work backwards to determine starting
        solutions is to allow for negative liquid values.

        Also highly dependent on user configuration and operating context
        and a bunch of other variables as of yet undetermined, probably
        dependent on container type.

        For now, we'll just manually set it for testing purposes to know
        that it works.
        """
        return self.__class__._allow_liquid_debt

    def add_liquid(self, ml=False, **kwargs):
        """
        You provide as keyword arguments liquid names and volumes in
        microliters.

        If you want it in milliliters, you can set ml=True in the
        kwargs.

        400ul of water:

        >> container.add_liquid(water=400)

        400ml of water:

        >> container.add_liquid(water=400, ml=True)

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

        self.assert_capacity(new_liquid)

        # assert_capacity will raise an error if the value is out of
        # bounds, so now we can add our liquids.
        for liquid in kwargs:
            vol = self.convert_ml(kwargs[liquid], ml)
            if liquid in self._contents:
                self._contents[liquid] = self._contents[liquid] + vol
            else:
                self._contents[liquid] = vol

    def add_named_liquid(self, amount, name, ml=False):
        """
        Adds a single liquid amount by liquid name.
        """
        kwargs = {}
        kwargs[name] = amount
        self.add_liquid(ml=ml, **kwargs)

    def assert_capacity(self, new_amount, ml=False):
        if not self.max_volume:
            raise ValueError("No maximum liquid amount set for well.")
        new_value = self.calculate_total_volume() + new_amount
        if (new_value > self.max_volume):
            raise ValueError(
                "Liquid amount ({}µl) exceeds max volume ({}µl)."
                .format(new_value, self.max_volume)
            )

    def calculate_total_volume(self, data=None):
        total = 0
        liqs = data or self._contents
        for l in liqs:
            total = total + liqs[l]
        return total

    def convert_ml(self, volume, ml=None):
        """
        Simple utility method to allow input of ul volume and multiply by
        a thousand if ml is set to True.

        Python doesn't support passing by reference. ;_;
        """
        if ml is None:
            raise Exception("Keyword argument 'ml' is required.")
        elif ml:
            return volume * 1000  # OMG metric <3 <3
        else:
            return volume

    def get_volume(self, name=None):
        if name:
            if name not in self._contents:
                raise KeyError(
                    "Liquid '{}' not in container.".format(name)
                )
            if len(self._contents.keys()) > 1:
                raise ValueError(
                    "Liquid '{}' is a component of a mixture.".format(name)
                )
        return self.calculate_total_volume()

    def get_proportion(self, key):
        if key in self._contents:
            return self._contents[key] / self.calculate_total_volume()
        else:
            raise KeyError(
                "Liquid '{}' not found in this container."
                .format(key)
            )

    def transfer(self, amount, destination, ml=False, name=None):
        amount = self.convert_ml(amount, ml)

        # Ensure there's room in the destination well first.
        destination.assert_capacity(amount)

        # Ensure we have enough total volume to proceed with the
        # request. (Don't worry about working volumes for now.)
        total_volume = self.calculate_total_volume()
        if (self._allow_liquid_debt is False and total_volume < amount):
            raise ValueError(
                "Not enough liquid ({}µl) for transfer ({}µl)."
                .format(total_volume, amount)
            )

        if self._allow_liquid_debt and total_volume is 0:
            if name is None:
                raise Exception(
                    "Liquid name required when liquid debt is enabled."
                )
            destination.add_named_liquid(amount, name=name)
            self._contents[name] = amount * -1
            return  # Skip the rest of the proportion stuff.

        # Proportion math. We want to include an equal proportion of
        # all the liquids mixed into this well.
        mix = {}
        liq = self._contents
        for l in liq:
            proportion = liq[l] / total_volume
            value      = proportion * amount
            self._contents[l] = self._contents[l] - value
            destination.add_named_liquid(value, l)


class LiquidWell(GridItem):

    """
    This is what you should use if you want to implement the smallest
    base component capable of keeping track of liquid inventories.

    It's a child of GridItem, so you also get coordinates, assuming it's
    been initialized within the context of a parent GridContainer.
    """

    _liquid = None

    def __init__(self, *args, **kwargs):

        super(LiquidWell, self).__init__(*args, **kwargs)

        custom = self._custom_properties or {}
        par = self.parent

        volume = custom.get('volume', par.volume)
        min_vol = custom.get('min_vol', par.min_vol)
        max_vol = custom.get('max_vol', par.max_vol)

        self._liquid = LiquidInventory(
            max=volume, min_working=min_vol, max_working=max_vol
        )

    def allocate(self, **kwargs):
        self._liquid.add_liquid(**kwargs)

    def add_liquid(self, **kwargs):
        self._liquid.add_liquid(**kwargs)

    def add_named_liquid(self, amount, name, **kwargs):
        self._liquid.add_named_liquid(amount, name, **kwargs)

    def get_volume(self, name=None):
        """
        This will return the computed volume of actual liquid in the well.
        """
        return self._liquid.get_volume(name)

    @property
    def max_volume(self):
        return self._liquid.max_volume

    def get_liquid_name(self):
        return self._liquid.get_liquid_name()

    def get_proportion(self, liquid):
        return self._liquid.get_proportion(liquid)

    def transfer(self, amount, destination, ml=False, name=None):
        return self._liquid.transfer(amount, destination, ml=ml, name=name)

    def assert_capacity(self, amount, ml=False):
        return self._liquid.assert_capacity(amount, ml=ml)
