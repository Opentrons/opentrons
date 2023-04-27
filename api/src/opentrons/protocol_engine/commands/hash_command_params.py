"""Hash command params into idempotent keys to track commands from analysis to run."""
from hashlib import md5
from typing import Optional

from .command import CommandIntent
from .command_unions import CommandCreate


# TODO(mc, 2022-11-02): this implementation is overly simplistic
# and exists solely for demostration purposes.
# Give it a real implementation with tests
# https://opentrons.atlassian.net/browse/RCORE-326
def hash_command_params(
    create: CommandCreate, last_hash: Optional[str]
) -> Optional[str]:
    """Given a command create object, return a hash.

    The hash is based on three things:
    - The command parameters
    - The latest hash (yo dawg I heard you like blockchains)
    - Whether the command is a setup command or a protocol command;
      setup commands are not hashed

    Args:
        create: The command create request.
        last_hash: The last command hash, if it exists.

    Returns:
        The command hash, if the command is a protocol command.
        `None` if the command is a setup command.
    """

    last_contribution = b"" if last_hash is None else last_hash.encode("ascii")
    this_contribution = md5(create.commandType.encode("ascii")).digest()
    to_hash = last_contribution + this_contribution
    return md5(to_hash).hexdigest()
