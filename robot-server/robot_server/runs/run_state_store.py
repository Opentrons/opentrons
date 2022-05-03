"""Engine state on-db store."""
import sqlalchemy
from dataclasses import dataclass
from typing import Dict, Optional
from pydantic import parse_obj_as
from datetime import datetime, timezone

from robot_server.persistence import run_state_table, ensure_utc_datetime
from .run_store import RunNotFoundError
from opentrons.protocol_engine import ProtocolRunData


@dataclass(frozen=True)
class RunStateResource:
    """An entry in the run state store, used to construct response models.

    This represents all run engine state derived from ProtocolEngine instance.
    """

    run_id: str
    state: ProtocolRunData
    engine_status: str
    created_at: Optional[datetime]


class RunStateStore:
    """Methods for storing and retrieving run resources."""

    def __init__(self, sql_engine: sqlalchemy.engine.Engine) -> None:
        """Initialize a RunStore with sql engine."""
        self._sql_engine = sql_engine

    def insert(self, state: RunStateResource) -> RunStateResource:
        """Insert engine state to db.

        Arguments:
            state: Engine state resource to store.

        Returns:
            The engine state that was added to the store.
        """
        statement = sqlalchemy.insert(run_state_table).values(
            _convert_state_to_sql_values(state=state)
        )
        with self._sql_engine.begin() as transaction:
            try:
                transaction.execute(statement)
            except sqlalchemy.exc.IntegrityError:
                raise RunNotFoundError(run_id=state.run_id)

        return state

    def get(self, run_id: str) -> RunStateResource:
        """Get engine state from db.

        Arguments:
            run_id: Run id related to the engine state.

        Returns:
            The engine state that found in the store.
        """
        statement = sqlalchemy.select(run_state_table).where(
            run_state_table.c.run_id == run_id
        )
        with self._sql_engine.begin() as transaction:
            state_row = transaction.execute(statement).one()
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

    created_at = ensure_utc_datetime(sql_row.created_at)

    return RunStateResource(
        run_id=run_id,
        state=parse_obj_as(ProtocolRunData, state),
        engine_status=status,
        created_at=created_at,
    )


def _convert_state_to_sql_values(state: RunStateResource) -> Dict[str, object]:
    return {
        "run_id": state.run_id,
        "state": state.state.dict(),
        "engine_status": state.engine_status,
        "created_at": ensure_utc_datetime(
            state.created_at
            if state.created_at is not None
            else datetime.now(tz=timezone.utc)
        ),
    }
