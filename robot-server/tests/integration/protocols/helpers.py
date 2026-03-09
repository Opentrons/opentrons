import contextlib
import json
from typing import Any, Dict, Iterator, cast
from opentrons.protocol_api import InstrumentContext


def load_config(name: str) -> Dict[str, Any]:
    """Load a configuration file"""
    with open(name, "rb") as f:
        return cast(Dict[str, Any], json.load(f))


@contextlib.contextmanager
def pick_up_then_drop(instrument: InstrumentContext) -> Iterator[None]:
    """Pick up then automatically drop the tip in a context manager"""
    instrument.pick_up_tip()
    yield
    instrument.drop_tip()
