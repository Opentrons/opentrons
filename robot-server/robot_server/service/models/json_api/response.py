from typing import Generic, TypeVar, Optional, List, \
    Dict, Any, Type, get_type_hints
from pydantic import Field
from pydantic.generics import GenericModel

from .resource_links import ResourceLinks
from . import ResourceTypes


AttributesT = TypeVar('AttributesT')


class ResponseDataModel(GenericModel, Generic[AttributesT]):
    """
    """
    id: str = \
        Field(...,
              description="id member represents a resource object.")
    type: ResourceTypes = \
        Field(...,
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


DataT = TypeVar('DataT', bound=ResponseDataModel)


class ResponseModel(GenericModel, Generic[DataT]):
    """
    """
    meta: Optional[Dict] = \
        Field(None,
              description="a meta object that contains non-standard"
                          " meta-information.")
    data: DataT = \
        Field(...,
              description="the document’s 'primary data'")
    links: Optional[ResourceLinks] = \
        Field(None,
              description="a links object related to the primary data.")

    # Note(isk: 3/13/20): resource_object for object marshalling.
    # This class method is for formating the data object response
    @classmethod
    def resource_object(
        cls,
        *,
        id: str,
        attributes: Optional[Dict] = None,
    ) -> ResponseDataModel:
        # Note(isk: 3/13/20): get_type_hints returns a dictionary containing
        # type hints for the class object.
        data_type = get_type_hints(cls)['data']
        # Note(isk: 3/13/20): check if '__origin__' attribute on data object is
        # a list, if not return None.
        if getattr(data_type, '__origin__', None) is list:
            data_type = data_type.__args__[0]
        # Note(isk: 3/24/20): get type name from _resource_type private
        # variable set in json_api_response
        typename = cls._resource_type     # type: ignore
        return data_type(
            id=id,
            type=typename,
            attributes=attributes or {},
        )


# Note(isk: 3/13/20): returns response based on whether
# the data object is a list or not
def json_api_response(
    resource_type: ResourceTypes,
    attributes_model: Any,
    *,
    use_list: bool = False
) -> Type[ResponseModel]:
    type_string = resource_type.value
    response_data_model = ResponseDataModel[attributes_model]    # type: ignore
    if use_list:
        response_data_model = List[response_data_model]    # type: ignore
        response_data_model.__name__ = f'ListResponseData[{type_string}]'
        response_model_list = ResponseModel[response_data_model]
        response_model_list.__name__ = f'ListResponse[{type_string}]'
        response_model_list._resource_type = type_string     # type: ignore
        return response_model_list
    else:
        response_data_model.__name__ = f'ResponseData[{type_string}]'
        response_model = ResponseModel[response_data_model]
        response_model.__name__ = f'Response[{type_string}]'
        response_model._resource_type = type_string     # type: ignore
        return response_model
