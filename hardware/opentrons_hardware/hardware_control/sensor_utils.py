from opentrons_shared_data.errors.exceptions import (
    TipHitWellBottomError,
)


import numpy as np


def detectLiquidOrBlockage(
        pressureReadings: list[float],
        liquidSolidThreshold: float
) -> None:
    dx = 1
    #take derivative of pressureReadings with respect to dx
    pressureDerivatives = np.gradient(pressureReadings[-5:], dx)
    endDerivative = pressureDerivatives[-1]
    if endDerivative > liquidSolidThreshold:
        #Hit Bottom of Well(solid)
        raise TipHitWellBottomError(
                "Tip hit the bottom of the well.",
                {
                    "Pressure change detected: " + str(endDerivative)
                },
            )
    else:
        #Hit Liquid
        return None
