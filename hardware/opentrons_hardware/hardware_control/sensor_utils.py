from opentrons_shared_data.errors.exceptions import (
    TipHitWellBottomError,
)


import numpy as np


def did_tip_hit_liquid(
        pressure_readings: list[float],
        liquid_solid_threshold: float
) -> bool:
    pressure_difference = np.gradient(pressure_readings[-5:], 1)
    end_difference = pressure_difference[-1]
    if end_difference > liquid_solid_threshold:
        #Hit Bottom of Well
        raise TipHitWellBottomError(
                "Tip hit the bottom of the well.",
                {
                    "Pressure change detected: " + str(end_difference)
                },
            )
    else:
        #Hit Liquid
        return True