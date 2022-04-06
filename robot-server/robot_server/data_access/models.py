import sqlalchemy
import datetime

metadata = sqlalchemy.MetaData()

protocol_table = sqlalchemy.Table(
    "protocol",
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
    # TODO(mm, 2022-03-29):
    # Storing pickled Python objects, especially of an internal class,
    # will cause migration and compatibility problems.
    sqlalchemy.Column(
        "source",
        sqlalchemy.PickleType,
        nullable=False,
    ),
    sqlalchemy.Column(
        "protocol_key",
        sqlalchemy.String,
        nullable=True
    )
)

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
    # sqlalchemy.Column(
    #     "updated_at",
    #     sqlalchemy.DateTime,
    #     nullable=False,
    #     onupdate=datetime.datetime.now
    # ),
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

action_runs_table = sqlalchemy.Table(
    "run_action",
    metadata,
    sqlalchemy.Column(
        "id",
        sqlalchemy.String,
        primary_key=True,
    ),
    sqlalchemy.Column(
        "created_at",
        sqlalchemy.DateTime,
        nullable=False
    ),
    sqlalchemy.Column(
        "action_type",
        sqlalchemy.String,
        nullable=False
    ),
    sqlalchemy.Column(
        "run_id",
        sqlalchemy.String,
        sqlalchemy.ForeignKey("protocol_run.id"),
        nullable=True
    ),
)
