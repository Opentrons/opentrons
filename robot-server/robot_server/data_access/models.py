import sqlalchemy
import datetime

metadata = sqlalchemy.MetaData()

run_table = sqlalchemy.Table(
    "protocol_run",
    metadata,
    sqlalchemy.Column(
        "id",
        sqlalchemy.String,
        primary_key=True,
    ),
    sqlalchemy.Column(
        "created_at",
        sqlalchemy.DateTime,
        nullable=False,
    ),
    sqlalchemy.Column(
        "updated_at",
        sqlalchemy.DateTime,
        nullable=False,
        onupdate=datetime.datetime.now
    ),
    sqlalchemy.Column(
        "protocol_id",
        sqlalchemy.String,
        forigen_key="protocol.id",
        nullable=True
    ),
    sqlalchemy.Column(
        "active_run",
        sqlalchemy.Boolean,
        nullable=False,
        default=False
    )
)
