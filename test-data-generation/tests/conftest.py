"""Pytest configuration file.

Contains hypothesis settings profiles.
"""

from hypothesis import settings, Verbosity, Phase


settings.register_profile(
    "dev",
    max_examples=10,
    verbosity=Verbosity.normal,
    deadline=None,
    phases=(Phase.explicit, Phase.reuse, Phase.generate, Phase.target),
)

settings.register_profile(
    "ci",
    max_examples=1000,
    verbosity=Verbosity.verbose,
    deadline=None,
)
