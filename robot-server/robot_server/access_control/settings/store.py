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
                for field_name, setting_key in _ACCESS_CONTROL_KEYS.items():
                    if row.key == setting_key.value:
                        values[field_name] = bool(row.value)
        return ResponseData.model_construct(**values)

    def set(self, field_name: str, value: bool | None) -> None:
        """Set a single access control setting.

        `None` means revert to the default.
        """
        setting_key = _ACCESS_CONTROL_KEYS[field_name]
        with self._sql_engine.begin() as transaction:
            transaction.execute(
                sqlalchemy.delete(boolean_setting_table).where(
                    boolean_setting_table.c.key == setting_key
                )
            )
            if value is not None:
                transaction.execute(
                    sqlalchemy.insert(boolean_setting_table).values(
                        key=setting_key,
                        value=value,
                    )
                )

    def patch(self, request: RequestData) -> ResponseData:
        """Apply a partial update to access control settings."""
        provided = request.model_dump(exclude_unset=True)
        for field_name, value in provided.items():
            self.set(field_name, value)
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
