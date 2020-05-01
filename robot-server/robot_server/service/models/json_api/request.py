from typing import Generic, TypeVar, Optional, Any, Type
from pydantic import Field
from pydantic.generics import GenericModel

from . import ResourceTypes

AttributesT = TypeVar('AttributesT')


class RequestDataModel(GenericModel, Generic[AttributesT]):
    """
    """
    id: Optional[str] = \
        Field(None,
              description="id member represents a resource object and is not"
                          " required when the resource object originates at"
                          " the client and represents a new resource to be"
                          " created on the server.")
    type: ResourceTypes = \
        Field(...,
              description="type member is used to describe resource objects"
                          " that share common attributes.")
    attributes: AttributesT = \
        Field(...,
              description="an attributes object representing some of the"
                          " resource’s data.")


DataT = TypeVar('DataT', bound=RequestDataModel)


class RequestModel(GenericModel, Generic[DataT]):
    """
    """
    data: DataT = \
        Field(...,
              description="the document’s 'primary data'")

    def attributes(self):
        return self.data.attributes


# Note(isk: 3/13/20): formats and returns request model
def json_api_request(
    resource_type: ResourceTypes,
    attributes_model: Any
):# -> Type[RequestModel]:
    type_string = resource_type.value
    request_data_model = RequestDataModel[attributes_model]    # type: ignore
    request_data_model.__name__ = f'RequestData[{type_string}]'
    request_model = RequestModel[request_data_model]
    request_model.__name__ = f'Request[{type_string}]'
    return request_model
