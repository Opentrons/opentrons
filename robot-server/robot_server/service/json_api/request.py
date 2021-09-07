from typing import Generic, TypeVar
from pydantic import Field
from pydantic.generics import GenericModel


RequestDataT = TypeVar("RequestDataT")


class RequestModel(GenericModel, Generic[RequestDataT]):
    """ """

    data: RequestDataT = Field(..., description="the document’s 'primary data'")
