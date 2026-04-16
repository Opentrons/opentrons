# noqa: D100


from typing import Annotated

import fastapi
import sqlalchemy

from .models import RequestData, ResponseData
from robot_server.persistence.fastapi_dependencies import get_sql_engine
from robot_server.persistence.tables import BooleanSettingKey, boolean_setting_table

_K = BooleanSettingKey

_DB_KEY_TO_FIELD_NAME: dict[BooleanSettingKey, str] = {
    _K.REQUIRE_SIGNOFF_FOR_PROTOCOL_LOG: "requireSignoffForProtocolLog",
    _K.REQUIRE_LOGS_TO_BE_SAVED_IN_APP: "requireLogsToBeSavedInApp",
    _K.DELETE_OVER_MAX_ON_DISK_PROTOCOLS: "deleteOverMaxOnDiskProtocols",
}

_FIELD_NAME_TO_DB_KEY: dict[str, BooleanSettingKey] = {
    v: k for k, v in _DB_KEY_TO_FIELD_NAME.items()
}


class AccessControlSettingStore:
    """Persistently stores settings related to access control."""

    def __init__(self, sql_engine: sqlalchemy.engine.Engine) -> None:
        self._sql_engine = sql_engine

    def get_all(self) -> ResponseData:
        """Get all access control settings."""
        with self._sql_engine.begin() as transaction:
            rows = transaction.execute(
                sqlalchemy.select(
                    boolean_setting_table.c.key,
                    boolean_setting_table.c.value,
                ).where(
                    boolean_setting_table.c.key.in_(list(_DB_KEY_TO_FIELD_NAME.keys()))
                )
            ).all()
            return ResponseData.model_validate(
                {_DB_KEY_TO_FIELD_NAME[row.key]: bool(row.value) for row in rows}
            )

    def patch(self, request: RequestData) -> ResponseData:
        """Apply a partial update to access control settings.

        Only fields explicitly provided in the request are updated.
        A value of ``None`` reverts that setting to its default (deletes the row).
        """
        provided = request.model_dump(exclude_unset=True)
        if not provided:
            return self.get_all()

        with self._sql_engine.begin() as transaction:
            keys_to_update = [_FIELD_NAME_TO_DB_KEY[name] for name in provided]
            transaction.execute(
                sqlalchemy.delete(boolean_setting_table).where(
                    boolean_setting_table.c.key.in_(keys_to_update)
                )
            )
            rows_to_insert = [
                {"key": _FIELD_NAME_TO_DB_KEY[name], "value": bool(value)}
                for name, value in provided.items()
                if value is not None
            ]
            if rows_to_insert:
                transaction.execute(
                    sqlalchemy.insert(boolean_setting_table),
                    rows_to_insert,
                )
        return self.get_all()

    def reset_all(self) -> None:
        """Reset all access control settings to defaults."""
        with self._sql_engine.begin() as transaction:
            transaction.execute(
                sqlalchemy.delete(boolean_setting_table).where(
                    boolean_setting_table.c.key.in_(list(_DB_KEY_TO_FIELD_NAME.keys()))
                )
            )


async def get_access_control_setting_store(
    sql_engine: Annotated[sqlalchemy.engine.Engine, fastapi.Depends(get_sql_engine)],
) -> AccessControlSettingStore:
    """A FastAPI dependency to return the server's AccessControlSettingStore."""
    return AccessControlSettingStore(sql_engine)
