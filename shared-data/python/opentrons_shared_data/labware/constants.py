from typing_extensions import Final


# Regular expression to validate and extract row, column from well name
# (ie A3, C1)
WELL_NAME_PATTERN: Final[str] = r"^([A-Z]+)([0-9]+)$"
