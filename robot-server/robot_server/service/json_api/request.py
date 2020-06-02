from typing import Generic, TypeVar, Optional, Any
from pydantic import Field
from pydantic.generics import GenericModel


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
    type: str = \
        Field(...,
              description="type member is used to describe resource objects"
                          " that share common attributes.")
    attributes: AttributesT = \
        Field(...,
              description="an attributes object representing some of the"
                          " resource’s data.")

    @classmethod
    def create(cls, attributes: AttributesT, resource_id: str = None):
        return RequestDataModel[AttributesT](
            id=resource_id,
            attributes=attributes,
            type=attributes.__class__.__name__)


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
    attributes_model: Any
):
    type_string = attributes_model.__name__
    request_data_model = RequestDataModel[attributes_model]  # type: ignore
    request_data_model.__name__ = f'RequestData[{type_string}]'
    request_model = RequestModel[request_data_model]
    request_model.__name__ = f'Request[{type_string}]'
    return request_model
