"""Interactive."""
from copy import deepcopy
from dataclasses import fields
from typing import Optional

from .definition import (
    LiquidClassSettings,
)


def _user_input_value_for_attribute(attribute: str, default: Optional[float]) -> float:
    if isinstance(default, bool):
        def_str = "y" if default else "n"
        type_str = "y/n"
    elif isinstance(default, float):
        def_str = str(default)
        type_str = "float"
    else:
        raise ValueError(f"unexpected default ({default}) type: {type(default)}")
    _inp = input(
        f"\t{attribute} = {def_str} ... <ENTER> to keep, or type new value ({type_str}): "
    )
    if not _inp:
        assert default is not None
        return default
    try:
        if isinstance(default, float):
            return float(_inp.strip())
        elif isinstance(default, bool):
            return bool(_inp.strip()[0].lower() == "y")
    except ValueError as e:
        print(e)
        return _user_input_value_for_attribute(attribute, default)


def interactively_build_liquid_class(
    default: LiquidClassSettings,
) -> LiquidClassSettings:
    ret = deepcopy(default)
    for asp_or_disp_field in fields(LiquidClassSettings):
        settings = getattr(default, asp_or_disp_field.name)
        print(f"{asp_or_disp_field.name.upper()}:")
        for f in fields(settings):
            _default: Optional[float] = getattr(settings, f.name)
            _new_val: float = _user_input_value_for_attribute(f.name, _default)
            setattr(settings, f.name, _new_val)
        setattr(ret, asp_or_disp_field.name, settings)
    return ret
