"""Multi-Channel Tips."""

CHANNEL_TEST_ORDER = [0, 1, 2, 3, 7, 6, 5, 4]  # zero indexed
CHANNEL_TO_TIP_ROW_LOOKUP = {  # zero indexed
    0: 7,
    1: 6,
    2: 4,
    3: 1,
    4: 6,
    5: 3,
    6: 1,
    7: 0,
}
CHANNEL_TO_SLOT_ROW_LOOKUP = {  # zero indexed
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 1,
    5: 1,
    6: 1,
    7: 1,
}

"""
Increment
 - 72x total transfers
     - 24x volumes
     - 3x trials
 
QC
 - 36x total transfers
     - 3x volumes
     - 12x trials
"""
