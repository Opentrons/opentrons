from pydantic import BaseSettings, BaseModel


class PipetteSettings(BaseModel):
    model: str = "p20_single_v2.0"
    id: str = "P20SV202020070101"


class SmoothieSettings(BaseModel):
    left: PipetteSettings = PipetteSettings(
        model="p20_multi_v2.0", id="P3HMV202020041605"
    )
    right: PipetteSettings = PipetteSettings(
        model="p20_single_v2.0", id="P20SV202020070101"
    )


class Settings(BaseSettings):
    smoothie: SmoothieSettings = SmoothieSettings()

    host: str = "0.0.0.0"

    class Config:
        env_prefix = "OT_EMULATOR_"
