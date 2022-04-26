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

    # TODO (tz): just for testing time parsing
    def insert_state_by_type(
        self, state: EngineStateResource, insert_pickle: bool
    ) -> EngineStateResource:
        """Insert engine state by type to db.

        Arguments:
        state: Engine state resource to store.

        Returns:
        The engine state that was added to the store.
        """
        if insert_pickle:
            insert_row = {"run_id": state.run_id, "state": state.state.dict()}
        else:
            insert_row = {
                "run_id": state.run_id,
                "state_string": state.state.json(),
            }

        statement = sqlalchemy.insert(engine_state_table).values(insert_row)
        with self._sql_engine.begin() as transaction:
            try:
                transaction.execute(statement)
            except sqlalchemy.exc.IntegrityError:
                raise RunNotFoundError(run_id=state.run_id)

        return state

    # TODO (tz): just for testing time parsing
    def get_state_by_type(
        self, run_id: str, return_pickle: bool
    ) -> EngineStateResource:
        """Get engine state by type from db.

        Arguments:
            run_id: Run id related to the engine state.
            return_pickle: Parse state as pickle or json.

        Returns:
            The engine state that found in the store.
        """
        statement = sqlalchemy.select(engine_state_table).where(
            engine_state_table.c.run_id == run_id
        )
        with self._sql_engine.begin() as transaction:
            state_row = transaction.execute(statement).one()
        if return_pickle:
            state_result = parse_obj_as(ProtocolRunData, state_row.state)
        else:
            state_result = ProtocolRunData.parse_raw(state_row.state_string)
        state_result

        return EngineStateResource(run_id=run_id, state=state_result)

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

    state = sql_row.state
    assert isinstance(state, Dict)

    return EngineStateResource(
        run_id=run_id, state=parse_obj_as(ProtocolRunData, state)
    )


def _convert_state_to_sql_values(state: EngineStateResource) -> Dict[str, object]:
    return {
        "run_id": state.run_id,
        "state": state.state.dict(),
    }
