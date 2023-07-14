class Command(BaseModel):
    commandType: str
    params: Params
    key: Optional[str]


class Labware(BaseModel):
    displayName: Optional[str]
    definitionId: str