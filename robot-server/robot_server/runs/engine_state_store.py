"""Engine state on-db store."""
import sqlalchemy
from dataclasses import dataclass
from typing import Dict

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
    # created_at: datetime


class EngineStateStore:
    """Methods for storing and retrieving run resources."""

    def __init__(self, sql_engine: sqlalchemy.engine.Engine) -> None:
        """Initialize a RunStore with sql engine."""
        self._sql_engine = sql_engine

    def insert(self, state: EngineStateResource) -> EngineStateResource:
        """Insert engine store state to db.

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


def _convert_state_to_sql_values(state: EngineStateResource) -> Dict[str, object]:
    return {"run_id": state.run_id, "state": state.state.json()}
