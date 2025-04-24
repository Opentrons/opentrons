"""Migrate the persistence directory from schema 10 to schema 11.

Summary of changes from schema 10:

- Update the values of the `state_summary` column in the `run` table. Each value is a
  JSON document. In that JSON document, we migrate the `.labwareOffsets[*].location` field
  to the newer `.labwareOffsets[*].locationSequence` field.

- Add an index to labware_offset_with_sequence: (active, row_id).
"""

import logging
from pathlib import Path

import sqlalchemy

from opentrons_shared_data.deck import load as load_deck

from opentrons.protocols.api_support.deck_type import (
    guess_from_global_config as guess_deck_type_from_global_config,
)
from opentrons.protocol_engine import (
    DeckType,
    StateSummary,
)
from opentrons.protocol_engine.labware_offset_standardization import (
    legacy_offset_location_to_offset_location_sequence,
)

from robot_server.persistence.database import sql_engine_ctx
from robot_server.persistence.file_and_directory_names import DB_FILE
from robot_server.persistence.pydantic import (
    json_to_pydantic,
    pydantic_to_json,
)
from robot_server.persistence.tables import schema_11

from ._util import copy_contents
from .._folder_migrator import Migration


_log = logging.getLogger(__name__)


class Migration10to11(Migration):  # noqa: D101
    def migrate(self, source_dir: Path, dest_dir: Path) -> None:
        """Migrate the persistence directory from schema 10 to 11."""
        copy_contents(source_dir=source_dir, dest_dir=dest_dir)

        with sql_engine_ctx(
            dest_dir / DB_FILE
        ) as engine, engine.begin() as transaction:
            _add_new_index(transaction)
            _upmigrate_labware_offsets_in_runs(transaction)


def _add_new_index(connection: sqlalchemy.engine.Connection) -> None:
    index = next(
        index
        for index in schema_11.labware_offset_table.indexes
        if index.name == "ix__labware_offset_with_sequence__active__row_id"
    )
    index.create(connection)


def _upmigrate_labware_offsets_in_runs(
    connection: sqlalchemy.engine.Connection,
) -> None:
    # grab the deck def. middlewares aren't up yet so we can't use the nice version
    deck_definition = load_deck(
        DeckType(guess_deck_type_from_global_config()), version=5
    )

    for run_id, raw_state_summary in connection.execute(
        sqlalchemy.select(schema_11.run_table.c.id, schema_11.run_table.c.state_summary)
    ).all():
        try:
            if raw_state_summary is None:
                new_raw_state_summary = raw_state_summary
            else:
                parsed_state_summary = json_to_pydantic(StateSummary, raw_state_summary)

                for labware_offset in parsed_state_summary.labwareOffsets:
                    if labware_offset.locationSequence is None:
                        labware_offset.locationSequence = (
                            legacy_offset_location_to_offset_location_sequence(
                                labware_offset.location, deck_definition
                            )
                        )
                    else:
                        # .locationSequence should always be None in this old data as far
                        # as I know, but just to be safe, preserve it if it's not.
                        pass

                new_raw_state_summary = pydantic_to_json(parsed_state_summary)

            connection.execute(
                sqlalchemy.update(schema_11.run_table)
                .where(schema_11.run_table.c.id == run_id)
                .values(state_summary=new_raw_state_summary)
            )

        except Exception:
            _log.error(
                f'Could not migrate labware offset locations in run "{run_id}".',
                exc_info=True,
            )
