"""A command line interface to return the server's current deck configuration.

This is a hack to let entry points like `opentrons_execute` automatically use the
robot's current deck configuration. Those entry points live outside of this package,
in the `opentrons` library, so they can't read the underlying storage themselves;
and this server can't run at the same time as them, so they can't get the deck config
by querying this server over localhost HTTP.

The right solution is probably either:

* Get the entry points to coexist with the server so they can do a localhost HTTP query.
* Or move storage of deck configuration from the server to the `opentrons` library
  so the entry points can read it directly.
"""

import argparse
import asyncio
import pathlib
import sys
import textwrap

from opentrons.protocol_engine.types import DeckType
from opentrons.protocols.api_support import deck_type


from robot_server.persistence.file_and_directory_names import (
    DECK_CONFIGURATION_FILE,
    LATEST_VERSION_DIRECTORY,
)
from . import store


def _main() -> None:
    parser = argparse.ArgumentParser(
        description=textwrap.dedent(
            """\
            Output, on stdout, this device's deck configuration, serialized in a form
            that the `opentrons` package knows how to deserialize.

            This is an internal CLI, for use by Opentrons only.
            """
        )
    )
    parser.add_argument(
        "--persistence-directory",
        type=pathlib.Path,
        required=True,
        help=textwrap.dedent(
            """\
            The path to robot-server's root persistence directory.
            This must match the persistence directory launch option that's normally
            provided to robot-server on this machine.
            """
        ),
    )

    persistence_directory = parser.parse_args().persistence_directory
    assert isinstance(persistence_directory, pathlib.Path)

    # This will not be correct if the server needs to run a migration to
    # LATEST_VERSION_DIRECTORY and this CLI runs before the server has had a chance to
    # complete that. We could theoretically do the migration ourselves right here, but
    # that would be dangerous if the server process is still running.
    probable_current_file = (
        persistence_directory / LATEST_VERSION_DIRECTORY / DECK_CONFIGURATION_FILE
    )

    host_deck_type = DeckType(deck_type.guess_from_global_config())

    serialized_bytes = asyncio.run(
        store.get_for_cli(host_deck_type, probable_current_file)
    )
    sys.stdout.buffer.write(serialized_bytes)


if __name__ == "__main__":
    _main()
