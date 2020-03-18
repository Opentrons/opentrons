from pydantic import BaseModel, Field


class ResourceLinks(BaseModel):
    """https://jsonapi.org/format/#document-links"""
    self: str = \
        Field(...,
              description="the link that generated the current"
                          " response document.")
