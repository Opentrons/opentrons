"""Engine state on-db store."""
import sqlalchemy
from dataclasses import dataclass
from pydantic import BaseModel
from typing import Dict
# from datetime import datetime

from opentrons.protocol_runner import ProtocolRunData
from robot_server.persistence import engine_state_table


@dataclass(frozen=True)
class EngineState:
    run_id: str
    state: ProtocolRunData
    # created_at: datetime


class EngineStateStore:
    """Methods for storing and retrieving run resources."""

    def __init__(self, sql_engine: sqlalchemy.engine.Engine) -> None:
        """Initialize a RunStore with sql engine."""
        self._sql_engine = sql_engine

    def insert(self, state: EngineState) -> EngineState:
        """Insert engine store state to db.

        Arguments:
            state: Engine state resource to store.

        Returns:
            The engine state that was added to the store.
        """
        state_insert = _convert_state_to_sql_values(state=state)
        # statement = sqlalchemy.insert(engine_state_table).values(
        #     _convert_state_to_sql_values(state=state)
        # )
        # with self._sql_engine.begin() as transaction:
        #     transaction.execute(statement)

        return state


def _convert_state_to_sql_values(state: EngineState) -> Dict[str, object]:
    return {
        "run_id": state.run_id,
        "state": state.state.json()
    }
