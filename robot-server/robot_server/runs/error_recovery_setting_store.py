# noqa: D100


import sqlalchemy

from robot_server.persistence.tables import enable_error_recovery_table


class ErrorRecoverySettingStore:
    """Persistently stores settings related to error recovery."""

    def __init__(self, sql_engine: sqlalchemy.engine.Engine) -> None:
        self._sql_engine = sql_engine

    def get_is_enabled(self) -> bool | None:
        """Get the value of the "error recovery enabled" setting.

        `None` is the default, i.e. it's never been explicitly set one way or the other.
        """
        with self._sql_engine.begin() as transaction:
            return transaction.execute(
                sqlalchemy.select(enable_error_recovery_table.c.enable_error_recovery)
            ).scalar_one_or_none()

    def set_is_enabled(self, is_enabled: bool) -> None:
        """Set the value of the "error recovery enabled" setting."""
        with self._sql_engine.begin() as transaction:
            transaction.execute(sqlalchemy.delete(enable_error_recovery_table))
            transaction.execute(
                sqlalchemy.insert(enable_error_recovery_table).values(
                    id=0,  # id=0 to match the single-row constraint trick in the table declaration.
                    enable_error_recovery=is_enabled,
                )
            )
