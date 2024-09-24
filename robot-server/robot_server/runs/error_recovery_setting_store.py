# noqa: D100


import sqlalchemy

from robot_server.persistence.tables import boolean_setting_table, BooleanSettingKey


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
                sqlalchemy.select(boolean_setting_table.c.value).where(
                    boolean_setting_table.c.key
                    == BooleanSettingKey.ENABLE_ERROR_RECOVERY
                )
            ).scalar_one_or_none()

    def set_is_enabled(self, is_enabled: bool) -> None:
        """Set the value of the "error recovery enabled" setting."""
        with self._sql_engine.begin() as transaction:
            transaction.execute(
                sqlalchemy.delete(boolean_setting_table).where(
                    boolean_setting_table.c.key
                    == BooleanSettingKey.ENABLE_ERROR_RECOVERY
                )
            )
            transaction.execute(
                sqlalchemy.insert(boolean_setting_table).values(
                    key=BooleanSettingKey.ENABLE_ERROR_RECOVERY,
                    value=is_enabled,
                )
            )
