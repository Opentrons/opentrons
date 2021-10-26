"""Session creation and management.

A "session" is a logical container for a user's interaction with a robot,
usually (but not always) with a well-defined start point and end point.
Examples of "sessions" include:

- A session to run a specific protocol
- A session to complete a specific calibration procedure
- A long running, "default" session to perform one-off actions, like toggling
  the frame lights on
"""
from .router import runs_router

__all__ = [
    "runs_router",
]
