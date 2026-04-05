# noqa: D100


from typing import Annotated

import fastapi
import sqlalchemy

from .models import RequestData, ResponseData
from robot_server.persistence.fastapi_dependencies import get_sql_engine
from robot_server.persistence.tables import BooleanSettingKey, boolean_setting_table

_ACCESS_CONTROL_KEYS: dict[str, BooleanSettingKey] = {
    field_name: BooleanSettingKey(field_name)
    for field_name in ResponseData.model_fields
    if field_name in {k.value for k in BooleanSettingKey}
}


class AccessControlSettingStore:
    """Persistently stores settings related to access control."""

    def __init__(self, sql_engine: sqlalchemy.engine.Engine) -> None:
        self._sql_engine = sql_engine

    def get_all(self) -> ResponseData:
        """Get all access control settings."""
        values = ResponseData().model_dump()
        with self._sql_engine.begin() as transaction:
            rows = transaction.execute(
                sqlalchemy.select(
                    boolean_setting_table.c.key,
                    boolean_setting_table.c.value,
                ).where(
                    boolean_setting_table.c.key.in_(
                        [k.value for k in _ACCESS_CONTROL_KEYS.values()]
                    )
                )
            ).all()
            for row in rows:
                values[row.key.value] = bool(row.value)
        return ResponseData.model_construct(**values)

    def patch(self, request: RequestData) -> ResponseData:
        """Apply a partial update to access control settings.

        Only fields explicitly provided in the request are updated.
        A value of ``None`` reverts that setting to its default (deletes the row).
        """
        provided = request.model_dump(exclude_unset=True)
        print("provided", provided)
        if not provided:
            return self.get_all()

        with self._sql_engine.begin() as transaction:
            keys_to_update = [_ACCESS_CONTROL_KEYS[name] for name in provided]
            print("keys_to_update", keys_to_update)
            transaction.execute(
                sqlalchemy.delete(boolean_setting_table).where(
                    boolean_setting_table.c.key.in_(keys_to_update)
                )
            )
            rows_to_insert = [
                {"key": _ACCESS_CONTROL_KEYS[name], "value": value}
                for name, value in provided.items()
                if value is not None
            ]
            print("rows_to_insert", rows_to_insert)
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
                    boolean_setting_table.c.key.in_(
                        [k.value for k in _ACCESS_CONTROL_KEYS.values()]
                    )
                )
            )


async def get_access_control_setting_store(
    sql_engine: Annotated[sqlalchemy.engine.Engine, fastapi.Depends(get_sql_engine)],
) -> AccessControlSettingStore:
    """A FastAPI dependency to return the server's AccessControlSettingStore."""
    return AccessControlSettingStore(sql_engine)
