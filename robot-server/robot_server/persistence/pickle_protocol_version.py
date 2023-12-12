# noqa: D100


from typing_extensions import Final


PICKLE_PROTOCOL_VERSION: Final = 4
"""The version of Python's pickle protocol that we should use for serializing new objects.

We set this to v4 because it's the least common denominator between all of our environments.
At the time of writing (2023-09-05):

* Flex: Python 3.8, pickle protocol v5 by default
* OT-2: Python 3.7, pickle protocol v4 by default
* Typical local dev environments: Python 3.7, pickle protocol v4 by default

For troubleshooting, we want our dev environments be able to read pickles created by any robot.
"""


# TODO(mm, 2023-09-05): Delete this when robot-server stops pickling new objects
# (https://opentrons.atlassian.net/browse/RSS-98), or when we upgrade the Python version
# in our dev environments.
