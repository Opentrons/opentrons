"""Interactive."""
from copy import deepcopy
from dataclasses import fields
from typing import Optional

from .defaults import get_default
from .definition import (
    LiquidClassSettings,
)


_INTERACTIVE_CACHE: Optional[LiquidClassSettings] = None


def _user_input_value_for_attribute(attribute: str, default: Optional[float]) -> float:
    try:
        _inp = input(
            f"\t{attribute} = {default} ... <ENTER> to keep, or type new value: "
        )
        if not _inp:
            return float(default)
        return float(_inp.strip())
    except ValueError as e:
        print(e)
        return _user_input_value_for_attribute(attribute, default)


def interactively_build_liquid_class(
    liquid: str, dilution: float
) -> LiquidClassSettings:
    global _INTERACTIVE_CACHE
    if not _INTERACTIVE_CACHE:
        _INTERACTIVE_CACHE = get_default(liquid, dilution)
    for asp_or_disp_field in fields(LiquidClassSettings):
        print(f"{asp_or_disp_field.name.upper()}:")
        settings = getattr(_INTERACTIVE_CACHE, asp_or_disp_field.name)
        for f in fields(settings):
            _default: Optional[float] = getattr(settings, f.name)
            _new_val: float = _user_input_value_for_attribute(f.name, _default)
            setattr(settings, f.name, _new_val)
        setattr(_INTERACTIVE_CACHE, asp_or_disp_field.name, settings)
    return deepcopy(_INTERACTIVE_CACHE)
