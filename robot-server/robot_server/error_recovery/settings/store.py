# noqa: D100


from typing import Annotated

import fastapi
import sqlalchemy

from robot_server.persistence.fastapi_dependencies import get_sql_engine
from robot_server.persistence.tables import boolean_setting_table, BooleanSettingKey


_ERROR_RECOVERY_ENABLED_DEFAULT = True


class ErrorRecoverySettingStore:
    """Persistently stores settings related to error recovery."""

    def __init__(self, sql_engine: sqlalchemy.engine.Engine) -> None:
        self._sql_engine = sql_engine

    def get_is_enabled(self) -> bool:
        """Get the value of the "error recovery enabled" setting."""
        with self._sql_engine.begin() as transaction:
            result: bool | None = transaction.execute(
                sqlalchemy.select(boolean_setting_table.c.value).where(
                    boolean_setting_table.c.key
                    == BooleanSettingKey.ENABLE_ERROR_RECOVERY
                )
            ).scalar_one_or_none()
        return result if result is not None else _ERROR_RECOVERY_ENABLED_DEFAULT

    def set_is_enabled(self, is_enabled: bool | None) -> None:
        """Set the value of the "error recovery enabled" setting.

        `None` means revert to the default.
        """
        with self._sql_engine.begin() as transaction:
            transaction.execute(
                sqlalchemy.delete(boolean_setting_table).where(
                    boolean_setting_table.c.key
                    == BooleanSettingKey.ENABLE_ERROR_RECOVERY
                )
            )
            if is_enabled is not None:
                transaction.execute(
                    sqlalchemy.insert(boolean_setting_table).values(
                        key=BooleanSettingKey.ENABLE_ERROR_RECOVERY,
                        value=is_enabled,
                    )
                )


async def get_error_recovery_setting_store(
    sql_engine: Annotated[sqlalchemy.engine.Engine, fastapi.Depends(get_sql_engine)]
) -> ErrorRecoverySettingStore:
    """A FastAPI dependency to return the server's ErrorRecoverySettingStore."""
    # Since the store itself has no state, and no asyncio.Locks or anything,
    # instances are fungible and disposable, and we can use a fresh one for each
    # request instead of having to maintain a global singleton.
    return ErrorRecoverySettingStore(sql_engine)
