def Mixture():
    """
    You must define your ingredients and their locations before referring
    to them within mixtures.  Use the allocate method for this.

    Allocations:

    >>> wellA.allocate(red_food_coloring=100)
    >>> wellB.allocate(water=100)
    >>> wellC.allocate(blue_food_coloring=100)

    Mixture Definitions:

    >>> red    = Mixture('red', water=98, red_food_coloring=2)
    >>> blue   = Mixture('blue', water=98, blue_food_coloring=2)
    >>> purple = Mixture('purple', blue=50, red=50)

    Then you can do:

    >>> well.acquire(purple=10)

    And the system can just figure out where to find 1ul red,
    1ul blue, 9.8ul water and add it to that particular well.
    """

    def __init__(self, name, **kwargs):
        """
        Defines a mixture by proportions (in percentages as ints,
        since floating points are a pain).

        The name must be unique, and will be added to the global
        registry of names for a given deck loadout.
        """
