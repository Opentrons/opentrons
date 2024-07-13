"""Primitive and CSV run time parameter resources."""
from __future__ import annotations

import sqlalchemy

from dataclasses import dataclass
from typing import Dict

from opentrons.protocols.parameters.types import PrimitiveAllowedTypes


@dataclass
class PrimitiveParameterResource:
    """A primitive runtime parameter from a completed analysis, storable in a SQL database."""

    analysis_id: str
    parameter_variable_name: str
    parameter_type: str
    parameter_value: PrimitiveAllowedTypes

    def to_sql_values(self) -> Dict[str, object]:
        """Return this data as a dict that can be passed to an SQLAlchemy insert.
        Avoid calling this from inside an SQL transaction since it involves
        some serialization and might be slow.
        """
        return {
            "analysis_id": self.analysis_id,
            "parameter_variable_name": self.parameter_variable_name,
            "parameter_type": self.parameter_type,
            "parameter_value": str(self.parameter_value),
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
        assert isinstance(parameter_type, str)

        param_types = {"str": str, "int": int, "float": float, "bool": bool}
        parameter_value = (
            param_types[parameter_type](sql_row.parameter_value)
            if sql_row.parameter_value is not None
            else None
        )

        return cls(
            analysis_id=analysis_id,
            parameter_variable_name=parameter_variable_name,
            parameter_type=parameter_type,
            parameter_value=parameter_value,
        )
