"""The public export of the server's ASGI app object.

For import speed, we do this from a dedicated file instead of from the top-level
__init__.py. We want worker processes and tests to be able to import specific things
deep in robot_server without having to import this ASGI app and all of its dependencies.
"""

from .app_setup import app

__all__ = ["app"]
