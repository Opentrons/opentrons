"""Pytest configuration file.

Contains hypothesis settings profiles.
"""

from hypothesis import HealthCheck, Phase, Verbosity, settings

# Hypothesis cannot shrink the DeckConfiguration object, but attempts to do so anyways.
# This causes tests to take exponentially longer, and then fail, which is less than ideal.
# So defaulting to not shrinking

# If there start being tests which do not use the DeckConfiguration object, then this Phase setting
# can be applied prescriptively to only tests that use the DeckConfiguration object.
DONT_SHRINK = set(settings.default.phases) - {Phase.shrink}

# The tests are slow because they are running the analysis on generated protocols, which takes longer than the default 200ms.
# The tests are also filtering a lot of examples because they are generating a lot of invalid protocols. But generating 
# examples is extremely fast, so we will leave this until we start seeing example generation start taking a long time.

ITS_GONNA_BE_SLOW = (HealthCheck.too_slow, HealthCheck.filter_too_much)

default = settings(
    suppress_health_check=ITS_GONNA_BE_SLOW,
    phases=DONT_SHRINK,
    verbosity=Verbosity.normal,
)

settings.register_profile(
    "exploratory",
    parent=default,
    max_examples=100,
    deadline=None,
)

settings.register_profile(
    "dev",
    parent=default,
    max_examples=2,
    deadline=None,
)


settings.register_profile(
    "ci",
    parent=default,
    max_examples=1000,
    deadline=None,
)
