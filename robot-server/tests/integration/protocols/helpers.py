import contextlib
import json


def load_config(name: str):
    """Load a configuration file"""
    with open(name, "rb") as f:
        return json.load(f)


@contextlib.contextmanager
def pick_up_then_drop(instrument):
    """Pick up then automatically drop the tip in a context manager"""
    instrument.pick_up_tip()
    yield
    instrument.drop_tip()
