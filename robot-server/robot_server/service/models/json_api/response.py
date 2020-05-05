from typing import Generic, TypeVar, Optional, List, \
    Dict, Any, Type, get_type_hints, Union
from pydantic import Field, validator
from pydantic.generics import GenericModel

from .resource_links import ResourceLinks


AttributesT = TypeVar('AttributesT')


class ResponseDataModel(GenericModel, Generic[AttributesT]):
    """
    """
    id: Optional[str] = \
        Field(None,
              description="id member represents a resource object.")
    type: Optional[str] = \
        Field(None,
              description="type member is used to describe resource objects"
                          " that share common attributes.")
    attributes: AttributesT = \
        Field({},
              description="an attributes object representing some of the"
                          " resource’s data.")

    # Note(isk: 3/13/20): Need this to validate attribute default
    # see here: https://pydantic-docs.helpmanual.io/usage/model_config/
    class Config:
        validate_all = True

    @classmethod
    def create(cls, attributes: AttributesT, resource_id: str):
        return ResponseDataModel[AttributesT](
            id=resource_id,
            attributes=attributes,
            type=attributes.__class__.__name__)


DataT = TypeVar('DataT', bound=Union[ResponseDataModel, List[ResponseDataModel]])
MetaT = TypeVar('MetaT')


class ResponseModel(GenericModel, Generic[DataT, MetaT]):
    """
    """
    meta: Optional[MetaT] = \
        Field(None,
              description="a meta object that contains non-standard"
                          " meta-information.")
    data: DataT = \
        Field(...,
              description="the document’s 'primary data'")
    links: Optional[ResourceLinks] = \
        Field(None,
              description="a links object related to the primary data.")


# Note(isk: 3/13/20): returns response based on whether
# the data object is a list or not
def json_api_response(
    attributes_model: Any,
    *,
    meta_data_model: Any = dict,
    use_list: bool = False
):
    type_string = attributes_model.__name__
    if use_list:
        response_data_model = List[ResponseDataModel[attributes_model]]
        response_data_model.__name__ = f'ListResponseData[{type_string}]'
        response_model_list = ResponseModel[response_data_model, meta_data_model]
        response_model_list.__name__ = f'ListResponse[{type_string}]'
        return response_model_list
    else:
        response_data_model = ResponseDataModel[attributes_model]
        response_data_model.__name__ = f'ResponseData[{type_string}]'
        response_model = ResponseModel[response_data_model, meta_data_model]
        response_model.__name__ = f'Response[{type_string}]'
        return response_model
