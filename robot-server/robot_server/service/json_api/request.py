from typing import Generic, TypeVar, Optional
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


class RequestModel(GenericModel, Generic[AttributesT]):
    """
    """
    data: RequestDataModel[AttributesT] = \
        Field(...,
              description="the document’s 'primary data'")

    def attributes(self):
        return self.data.attributes
