import re
from typing_extensions import Final
from typing import Literal


# Regular expression to validate and extract row, column from well name
# (ie A3, C1)
WELL_NAME_PATTERN: Final["re.Pattern[str]"] = re.compile(r"^([A-Z]+)([0-9]+)$", re.X)

# These shapes are for wellshape definitions and describe the top of the well
Circular = Literal["circular"]
Rectangular = Literal["rectangular"]

# These shapes are used to describe the 3D primatives used to build wells
Conical = Literal["conical"]
Pyramidal = Literal["pyramidal"]
SquaredCone = Literal["squaredcone"]
RoundedPyramid = Literal["roundedpyramid"]
Spherical = Literal["spherical"]
