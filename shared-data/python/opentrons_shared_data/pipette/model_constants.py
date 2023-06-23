import enum
from dataclasses import dataclass


@dataclass
class RobotMountConfigs:
    stepsPerMM: float
    homePosition: float
    travelDistance: float


class Quirks(enum.Enum):
    pickupTipShake = "pickupTipShake"
    dropTipShake = "dropTipShake"
    doubleDropTip = "doubleDropTip"
    needsUnstick = "needsUnstick"


QUIRKS_LOOKUP_TABLE = {
    "p10_single": {
        "GEN1": {
            "default": [Quirks.dropTipShake]
		}
	},
    "p10_multi": {
        "GEN1": {
            "default": [Quirks.dropTipShake],
            "1.5": [Quirks.doubleDropTip, Quirks.dropTipShake],
            "1.6": [Quirks.doubleDropTip, Quirks.dropTipShake]
		}
	},
    "p20_single": {
        "GEN2": {
            "default": []
		}
	},
    "p20_multi": {
        "GEN2": {
            "default": []
		} 
	},
    "p50_single": { 
        "GEN1": {
            "default": [Quirks.dropTipShake],
		}},
    "p50_multi": {
        "GEN1": {
            "default": [Quirks.dropTipShake],
            "1.5": [Quirks.doubleDropTip, Quirks.dropTipShake]
		}
	},
    "p300_single": {
        "GEN1": {
            "default": [Quirks.dropTipShake],
		},
        "GEN2": {
            "default": []
		}
	},
    "p300_multi": {
        "GEN1": {
            "default": [Quirks.dropTipShake],
            "1.5": [Quirks.doubleDropTip, Quirks.dropTipShake]
		},
        "GEN2": {
            "default": [Quirks.needsUnstick]
		},
    "p1000_single": {
        "GEN1": {
            "default": [Quirks.pickupTipShake, Quirks.dropTipShake]
		},
    	"GEN2": {
            "default": [Quirks.pickupTipShake, Quirks.dropTipShake]
		}
	}
	},
    
}
    
MOUNT_CONFIG_LOOKUP_TABLE = {
    "GEN1": RobotMountConfigs(768, 220, 30),
    "GEN2": RobotMountConfigs(3200, 155.75, 60),
    "FLEX": RobotMountConfigs(2133.33, 230.15, 80)
}
