"""robot_server.authentication: Module for authenticating user access."""
from .dependencies import check_auth_token_header

__all__ = ["check_auth_token_header"]
