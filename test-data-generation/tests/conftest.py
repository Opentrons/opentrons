"""Pytest configuration file.

Contains hypothesis settings profiles.
"""

from hypothesis import settings, Verbosity


settings.register_profile(
    "dev",
    max_examples=10,
    verbosity=Verbosity.normal,
    deadline=None,
)

settings.register_profile(
    "ci",
    max_examples=1000,
    verbosity=Verbosity.verbose,
    deadline=None,
)
