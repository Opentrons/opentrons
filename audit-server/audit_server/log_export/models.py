from typing import Annotated

import pydantic


class _StrictBaseModel(pydantic.BaseModel):
    pass


class DeleteLogPeriodResult(_StrictBaseModel):
    """Return value for delete log period."""

    deletedPeriodId: Annotated[
        str, pydantic.Field(description="ID of the deleted log period.")
    ]
