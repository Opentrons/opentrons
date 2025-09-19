"""Primitive and CSV run time parameter resources."""
from __future__ import annotations

import sqlalchemy
import json

from dataclasses import dataclass
from typing import Dict, Optional

from robot_server.persistence.tables import PrimitiveParamSQLEnum
from opentrons.protocols.parameters.types import PrimitiveAllowedTypes


@dataclass
class PrimitiveParameterResource:
    """A primitive runtime parameter from a completed analysis, storable in a SQL database."""

    analysis_id: str
    parameter_variable_name: str
    parameter_type: str
    parameter_value: PrimitiveAllowedTypes

    def to_sql_values(self) -> Dict[str, object]:
        """Return this data as a dict that can be passed to an SQLAlchemy insert."""
        return {
            "analysis_id": self.analysis_id,
            "parameter_variable_name": self.parameter_variable_name,
            "parameter_type": PrimitiveParamSQLEnum(self.parameter_type),
            "parameter_value": json.dumps(self.parameter_value),
        }

    @classmethod
    def from_sql_row(
        cls,
        sql_row: sqlalchemy.engine.Row,
    ) -> PrimitiveParameterResource:
        """Extract the data from an SQLAlchemy row object."""
        analysis_id = sql_row.analysis_id
        assert isinstance(analysis_id, str)

        parameter_variable_name = sql_row.parameter_variable_name
        assert isinstance(parameter_variable_name, str)

        parameter_type = sql_row.parameter_type
        assert isinstance(parameter_type, PrimitiveParamSQLEnum)

        parameter_val_str = sql_row.parameter_value
        assert isinstance(parameter_val_str, str)

        parameter_value = json.loads(sql_row.parameter_value)

        return cls(
            analysis_id=analysis_id,
            parameter_variable_name=parameter_variable_name,
            parameter_type=parameter_type.value,
            parameter_value=parameter_value,
        )


@dataclass
class CSVParameterResource:
    """A CSV runtime parameter from a completed analysis, storable in a SQL database."""

    analysis_id: str
    parameter_variable_name: str
    file_id: Optional[str]

    def to_sql_values(self) -> Dict[str, object]:
        """Return this data as a dict that can be passed to an SQLAlchemy insert."""
        return {
            "analysis_id": self.analysis_id,
            "parameter_variable_name": self.parameter_variable_name,
            "file_id": self.file_id,
        }

    @classmethod
    def from_sql_row(
        cls,
        sql_row: sqlalchemy.engine.Row,
    ) -> CSVParameterResource:
        """Extract CSV resource data from SQLAlchemy row object."""
        analysis_id = sql_row.analysis_id
        assert isinstance(analysis_id, str)

        parameter_variable_name = sql_row.parameter_variable_name
        assert isinstance(parameter_variable_name, str)

        csv_file_id = sql_row.file_id
        assert isinstance(csv_file_id, str) or csv_file_id is None

        return cls(
            analysis_id=analysis_id,
            parameter_variable_name=parameter_variable_name,
            file_id=csv_file_id,
        )
