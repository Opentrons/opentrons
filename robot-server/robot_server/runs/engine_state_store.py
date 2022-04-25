"""Engine state on-db store."""
import sqlalchemy
from dataclasses import dataclass
from typing import Dict, Optional
from pydantic import parse_obj_as

from opentrons.protocol_runner import ProtocolRunData

from robot_server.persistence import engine_state_table
from .run_store import RunNotFoundError


@dataclass(frozen=True)
class EngineStateResource:
    """An entry in the engine state store, used to construct response models.

    This represents all run engine state derived from ProtocolEngine instance.
    """

    run_id: str
    state: ProtocolRunData
    state_string: Optional[str] = None
    # created_at: datetime


class EngineStateStore:
    """Methods for storing and retrieving run resources."""

    def __init__(self, sql_engine: sqlalchemy.engine.Engine) -> None:
        """Initialize a RunStore with sql engine."""
        self._sql_engine = sql_engine

    def insert(self, state: EngineStateResource) -> EngineStateResource:
        """Insert engine state to db.

        Arguments:
            state: Engine state resource to store.

        Returns:
            The engine state that was added to the store.
        """
        statement = sqlalchemy.insert(engine_state_table).values(
            _convert_state_to_sql_values(state=state)
        )
        with self._sql_engine.begin() as transaction:
            try:
                transaction.execute(statement)
            except sqlalchemy.exc.IntegrityError:
                raise RunNotFoundError(run_id=state.run_id)

        return state

    def get(self, run_id: str) -> EngineStateResource:
        """Get engine state from db.

        Arguments:
            run_id: Run id related to the engine state.

        Returns:
            The engine state that found in the store.
        """
        statement = sqlalchemy.select(engine_state_table).where(
            engine_state_table.c.run_id == run_id
        )
        with self._sql_engine.begin() as transaction:
            state_row = transaction.execute(statement).one()
        return _convert_sql_row_to_sql_engine_state(state_row)


def _convert_sql_row_to_sql_engine_state(
        sql_row: sqlalchemy.engine.Row,
) -> EngineStateResource:
    run_id = sql_row.run_id
    assert isinstance(run_id, str)

    state_pickle = sql_row.state_pickle
    assert isinstance(state_pickle, Dict)

    state_string = sql_row.state_string
    assert isinstance(state_string, str)

    return EngineStateResource(run_id=run_id, state=parse_obj_as(ProtocolRunData, state_pickle), state_string=ProtocolRunData.parse_raw(state_string))


def _convert_state_to_sql_values(state: EngineStateResource) -> Dict[str, object]:
    return {"run_id": state.run_id, "state_pickle": state.state.dict(), "state_string": state.state.json()}
