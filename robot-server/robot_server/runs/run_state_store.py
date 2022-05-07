"""Engine state on-db store."""
import sqlalchemy
from dataclasses import dataclass
from typing import Dict, Optional, List
from pydantic import parse_obj_as
from datetime import datetime, timezone

from robot_server.persistence import run_table, ensure_utc_datetime
from .run_store import RunNotFoundError
from opentrons.protocol_engine import ProtocolRunData
from opentrons.protocol_engine.commands import Command

@dataclass(frozen=True)
class RunStateResource:
    """An entry in the run state store, used to construct response models.

    This represents all run engine state derived from ProtocolEngine instance.
    """

    run_id: str
    state: ProtocolRunData
    # TODO (tz): initialize with factory default
    commands: Optional[List[Command]]
    engine_status: str
    _updated_at: Optional[datetime]


class RunStateStore:
    """Methods for storing and retrieving run resources."""

    def __init__(self, sql_engine: sqlalchemy.engine.Engine) -> None:
        """Initialize a RunStore with sql engine."""
        self._sql_engine = sql_engine

    def update_run(self, state: RunStateResource) -> RunStateResource:
        """update run table with run state to db.

        Arguments:
            state: Engine state resource to store.

        Returns:
            The engine state that was added to the store.
        """
        statement = sqlalchemy.update(run_table).where(run_table.c.id == state.run_id).values(
            _convert_state_to_sql_values(state=state)
        )
        with self._sql_engine.begin() as transaction:
            try:
                transaction.execute(statement)
            except sqlalchemy.exc.NoResultFound:
                raise RunNotFoundError(run_id=state.run_id)

        return state

    def get(self, run_id: str) -> RunStateResource:
        """Get engine state from db.

        Arguments:
            run_id: Run id related to the engine state.

        Returns:
            The engine state that found in the store.
        """
        statement = sqlalchemy.select(run_table).where(
            run_table.c.id == run_id
        )
        with self._sql_engine.begin() as transaction:
            try:
                state_row = transaction.execute(statement).one()
            except sqlalchemy.exc.NoResultFound:
                raise RunNotFoundError(run_id=run_id)
        return _convert_sql_row_to_sql_run_state(state_row)


def _convert_sql_row_to_sql_run_state(
    sql_row: sqlalchemy.engine.Row,
) -> RunStateResource:

    run_id = sql_row.run_id
    assert isinstance(run_id, str)

    status = sql_row.engine_status
    assert isinstance(status, str)

    state = sql_row.state
    assert isinstance(state, Dict)

    # TODO (tz): set sql_row.commands add assert
    commands = []

    _updated_at = ensure_utc_datetime(sql_row._updated_at)

    return RunStateResource(
        run_id=run_id,
        state=parse_obj_as(ProtocolRunData, state),
        engine_status=status,
        commands=commands,
        _updated_at=_updated_at,
    )


def _convert_state_to_sql_values(state: RunStateResource) -> Dict[str, object]:
    return {
        "state": state.state.dict(),
        "engine_status": state.engine_status,
        "_updated_at": ensure_utc_datetime(
            state._updated_at
            if state._updated_at is not None
            else datetime.now(tz=timezone.utc)
        ),
    }
