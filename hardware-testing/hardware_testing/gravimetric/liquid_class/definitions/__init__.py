from typing import Dict
from ..liquid_class_settings import *
from . import water


# FIXME: add glycerol, ethanol (at appropriate dilutions)
_all_classes: Dict[str, Dict[str, Dict[str, Dict[str, Dict[float, Liquid]]]]] = {
    "water": {
        "t1000": {
            "p1000": {
                "1ch": water.t1000.p1000.single_channel.VOLUMES,
            },
        },
    },
}


def get_liquid_class(
    liquid: str, dilution: float, pipette: int, channels: int, tip: int, volume: int
) -> Liquid:
    """Get liquid class."""
    dil_str = "" if not dilution or dilution == 1.0 else f"-{int(dilution * 100)}"
    cls_per_volume = _all_classes[f"{liquid}{dil_str}"][f"t{tip}"][f"p{pipette}"][
        f"{channels}ch"
    ]
    defined_volumes = list(cls_per_volume.keys())
    defined_volumes.sort()
    assert len(defined_volumes) == 3

    def _get_interp_liq_class(lower_ul: float, upper_ul: float) -> Liquid:
        lower_cls = cls_per_volume[lower_ul]
        upper_cls = cls_per_volume[upper_ul]
        return Liquid.interpolate(volume, lower_ul, upper_ul, lower_cls, upper_cls)

    # FIXME: this assumes there is 3x volumes defined for every class
    #        if we have more or less, this will break
    if volume <= defined_volumes[0]:
        return cls_per_volume[defined_volumes[0]]
    elif volume < defined_volumes[1]:
        return _get_interp_liq_class(defined_volumes[0], defined_volumes[1])
    elif volume == defined_volumes[1]:
        return cls_per_volume[defined_volumes[1]]
    elif volume < defined_volumes[2]:
        return _get_interp_liq_class(defined_volumes[1], defined_volumes[2])
    else:
        return cls_per_volume[defined_volumes[2]]


def get_csv_str() -> str:
    combos_header = "liquid,tip,pipette,channels,volume"
    full_data = ""
    for liq, liq_cls_per_tip in _all_classes.items():
        for tip, liq_cls_per_pipette in liq_cls_per_tip.items():
            for pip, liq_cls_per_channel in liq_cls_per_pipette.items():
                for channel, liq_cls_per_volume in liq_cls_per_channel.items():
                    for volume, liq_cls in liq_cls_per_volume.items():
                        if not full_data:
                            # first add a header
                            params_header = CSV_SEPARATOR.join(liq_cls.csv_header())
                            full_data += (
                                f"{combos_header}{CSV_SEPARATOR}{params_header}\n"
                            )
                        combos_data = CSV_SEPARATOR.join(
                            [liq, tip, pip, channel, str(volume)]
                        )
                        csv_data = CSV_SEPARATOR.join(liq_cls.csv_data())
                        full_data += f"{combos_data}{CSV_SEPARATOR}{csv_data}\n"
    return full_data


__all__ = [
    "get_liquid_class",
    "get_csv_str",
]
