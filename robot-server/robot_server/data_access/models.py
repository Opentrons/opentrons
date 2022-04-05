import sqlalchemy


def add_tables_to_db(sql_engine: sqlalchemy.engine.Engine) -> None:
    """Create the necessary database tables to back a `ProtocolStore`.

    Params:
        sql_engine: An engine for a blank SQL database, to put the tables in.
    """
    _metadata.create_all(sql_engine)


_metadata = sqlalchemy.MetaData()

run_table = sqlalchemy.Table(
    "protocol_run",
    _metadata,
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