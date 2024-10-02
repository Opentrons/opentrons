import re
from typing_extensions import Final
from typing import Literal


# Regular expression to validate and extract row, column from well name
# (ie A3, C1)
WELL_NAME_PATTERN: Final["re.Pattern[str]"] = re.compile(r"^([A-Z]+)([0-9]+)$", re.X)

Circular = Literal["circular"]
Rectangular = Literal["rectangular"]
TruncatedCircular = Literal["truncatedcircular"]
RoundedRectangular = Literal["roundedrectangular"]
Spherical = Literal["spherical"]
