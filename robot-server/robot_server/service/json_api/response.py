from typing import Generic, TypeVar, Optional, List
from pydantic import Field
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


MetaT = TypeVar('MetaT')


class ResponseModel(GenericModel, Generic[AttributesT, MetaT]):
    """
    """
    meta: Optional[MetaT] = \
        Field(None,
              description="a meta object that contains non-standard"
                          " meta-information.")
    links: Optional[ResourceLinks] = \
        Field(None,
              description="a links object related to the primary data.")
    data: ResponseDataModel[AttributesT] = \
        Field(...,
              description="the document’s 'primary data'")


class MultiResponseModel(GenericModel, Generic[AttributesT, MetaT]):
    """
    """
    meta: Optional[MetaT] = \
        Field(None,
              description="a meta object that contains non-standard"
                          " meta-information.")
    links: Optional[ResourceLinks] = \
        Field(None,
              description="a links object related to the primary data.")
    data: List[ResponseDataModel[AttributesT]] = \
        Field(...,
              description="the document’s 'primary data'")
