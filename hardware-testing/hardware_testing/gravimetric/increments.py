"""Increments."""
from typing import List

P50_T50 = [
    1.100,
    1.200,
    1.370,
    1.700,
    2.040,
    2.660,
    3.470,
    3.960,
    4.350,
    4.800,
    5.160,
    5.890,
    6.730,
    8.200,
    10.020,
    11.100,
    14.910,
    28.940,
    53.500,
    56.160,
]

P1000_T50 = [
    2.530,
    2.700,
    3.000,
    3.600,
    4.040,
    4.550,
    5.110,
    5.500,
    5.750,
    6.000,
    6.460,
    7.270,
    8.170,
    11.000,
    12.900,
    16.510,
    26.400,
    33.380,
    53.360,
    60.000,
]

P1000_T200 = [
    3.250,
    3.600,
    4.400,
    6.220,
    7.310,
    8.600,
    11.890,
    13.990,
    22.750,
    36.990,
    56.000,
    97.830,
    159.090,
    187.080,
    220.000,
]

P1000_T1000 = [
    3.000,
    4.000,
    5.000,
    7.270,
    12.800,
    15.370,
    18.530,
    56.950,
    99.840,
    120.380,
    254.480,
    369.990,
    446.130,
    648.650,
    1030.000,
    1137.160,
]


def get_volume_increments(pipette_volume: int, tip_volume: int) -> List[float]:
    """Get volume increments."""
    if pipette_volume == 50:
        if tip_volume == 50:
            return P50_T50
    elif pipette_volume == 1000:
        if tip_volume == 50:
            return P1000_T50
        elif tip_volume == 200:
            return P1000_T200
        elif tip_volume == 1000:
            return P1000_T1000
    raise ValueError(f"unexpected pipette-tip combo: P{pipette_volume}-T{tip_volume}")
