from pydantic import BaseModel

class ResourceLinks(BaseModel):
    self: str

ResourceLinks.__doc__ = "https://jsonapi.org/format/#document-links"