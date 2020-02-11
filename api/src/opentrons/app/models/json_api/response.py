from typing import Generic, TypeVar, Optional, List, Any, Type
from typing_extensions import Literal

from pydantic import validator
from pydantic.generics import GenericModel

from .resource_links import ResourceLinks
from .errors import Error

TypeT = TypeVar('TypeT', bound=str)
AttributesT = TypeVar('AttributesT')
class ResponseDataModel(GenericModel, Generic[TypeT, AttributesT]):
    """
    """
    id: str
    type: TypeT
    attributes: AttributesT = {}

    class Config:
        validate_all = True

DataT = TypeVar('DataT', bound=ResponseDataModel)
class ResponseModel(GenericModel, Generic[DataT]):
    """
    """
    meta: Optional[dict]
    data: DataT
    links: Optional[ResourceLinks]

def JsonApiResponse(
    type_string: str,
    attributes_model: Any,
    *,
    use_list: bool = False
) -> Type[ResponseModel]:
    response_data_model = ResponseDataModel[
        Literal[type_string],
        attributes_model,
    ]
    if use_list:
        response_data_model = List[response_data_model]
        response_data_model.__name__ = f'ListResponseData[{type_string}]'
        response_model = ResponseModel[response_data_model]
        response_model.__name__ = f'ListResponse[{type_string}]'
    else:
        response_data_model.__name__ = f'ResponseData[{type_string}]'
        response_model = ResponseModel[response_data_model]
        response_model.__name__ = f'Response[{type_string}]'
    return response_model