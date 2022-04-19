"""Commands' on-db store."""
import sqlalchemy

from robot_server.persistence import engine_state_table


class CommandStore:
    """Methods for storing and retrieving run resources."""

    def __init__(self, sql_engine: sqlalchemy.engine.Engine) -> None:
        """Initialize a RunStore with sql engine."""
        self._sql_engine = sql_engine
