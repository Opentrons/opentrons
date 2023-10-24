import re
from dataclasses import dataclass

# TODO MEOW THIS STRING TYPE TO SHARED PLACE
ACCEPTABLE_NOZZLE_KEY_RE = re.compile("[A-Z][0-100]")


@dataclass
class NozzleLayoutBase:
    primary_nozzle: str

    def __post_init__(self):
        if not ACCEPTABLE_NOZZLE_KEY_RE.match(self.primary_nozzle):
            raise ValueError(
                f"{self.primary_nozzle} does not fit the standard nozzle naming convention. Please ensure the nozzle is labled <LETTER><NUMBER> and that your letter is capitalized."
            )


@dataclass
class SingleNozzleLayout(NozzleLayoutBase):
    pass


@dataclass
class RowNozzleLayout(NozzleLayoutBase):
    pass


@dataclass
class ColumnNozzleLayout(NozzleLayoutBase):
    pass


@dataclass
class QuadrantNozzleLayout(NozzleLayoutBase):
    back_left_nozzle: str
    front_right_nozzle: str

    def __post_init__(self):
        if not ACCEPTABLE_NOZZLE_KEY_RE.match(self.back_left_nozzle):
            raise ValueError(
                f"{self.back_left_nozzle} does not fit the standard nozzle naming convention. Please ensure the nozzle is labled <LETTER><NUMBER> and that your letter is capitalized."
            )
        if not ACCEPTABLE_NOZZLE_KEY_RE.match(self.front_right_nozzle):
            raise ValueError(
                f"{self.front_right_nozzle} does not fit the standard nozzle naming convention. Please ensure the nozzle is labled <LETTER><NUMBER> and that your letter is capitalized."
            )
