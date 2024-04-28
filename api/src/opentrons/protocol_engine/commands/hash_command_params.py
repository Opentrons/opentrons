"""Hash command params into idempotent keys to track commands from analysis to run."""
from hashlib import md5
from typing import Optional

from .command import CommandIntent
from .command_unions import CommandCreate


# TODO(mm, 2023-04-28):
# This implementation will not notice that commands are different if they have different params
# but share the same commandType. We should also hash command params. (Jira RCORE-326.)
def hash_protocol_command_params(
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
    if create.intent in [CommandIntent.SETUP, CommandIntent.FIXIT]:
        return None
    # We avoid Python's built-in hash() function because it's not stable across
    # runs of the Python interpreter. (Jira RSS-215.)
    last_contribution = b"" if last_hash is None else last_hash.encode("ascii")
    this_contribution = md5(create.commandType.encode("ascii")).digest()
    to_hash = last_contribution + this_contribution
    return md5(to_hash).hexdigest()
