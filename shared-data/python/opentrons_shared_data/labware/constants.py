import re
from typing_extensions import Final
from typing import Literal, Union


# Regular expression to validate and extract row, column from well name
# (ie A3, C1)
WELL_NAME_PATTERN: Final["re.Pattern[str]"] = re.compile(r"^([A-Z]+)([0-9]+)$", re.X)

# These shapes are for wellshape definitions and describe the top of the well
CircularType = Literal["circular"]
Circular: CircularType = "circular"
RectangularType = Literal["rectangular"]
Rectangular: RectangularType = "rectangular"
WellShape = Union[Literal["circular"], Literal["rectangular"]]

# These shapes are used to describe the 3D primatives used to build wells
Conical = Literal["conical"]
Cuboidal = Literal["cuboidal"]
SquaredCone = Literal["squaredcone"]
RoundedCuboid = Literal["roundedcuboid"]
Spherical = Literal["spherical"]
