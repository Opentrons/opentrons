from typing import Generic, TypeVar, Optional, List
from pydantic import Field, BaseModel
from pydantic.generics import GenericModel

from .resource_links import ResourceLinks


class ResponseDataModel(BaseModel):
    """
    """
    id: str = \
        Field(None,
              description="id member represents a resource object.")


ResponseDataT = TypeVar('ResponseDataT', bound=ResponseDataModel)


DESCRIPTION_DATA = "the document’s 'primary data'"

DESCRIPTION_LINKS = "a links object related to the primary data."

DESCRIPTION_META = "a meta object that contains non-standard" \
                             " meta-information."


class ResponseModel(GenericModel, Generic[ResponseDataT]):
    """A response that returns a single resource"""

    links: Optional[ResourceLinks] = Field(None, description=DESCRIPTION_LINKS)
    data: ResponseDataT = Field(
        ...,
        description=DESCRIPTION_DATA
    )


class MultiResponseModel(GenericModel, Generic[ResponseDataT]):
    """A response that returns multiple resources"""

    links: Optional[ResourceLinks] = Field(None, description=DESCRIPTION_LINKS)
    data: List[ResponseDataT] = Field(
        ...,
        description=DESCRIPTION_DATA
    )
