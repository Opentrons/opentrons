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
    host: str = "0.0.0.0"
    port: int = 9996


class ProxySettings(BaseSettings):
    """Settings for a proxy."""

    host: str = "0.0.0.0"
    emulator_port: int
    driver_port: int


class ModuleServerSettings(BaseModel):
    """Settings for the module server"""

    host: str = "0.0.0.0"
    port: int = 8888


class Settings(BaseSettings):
    smoothie: SmoothieSettings = SmoothieSettings()

    host: str = "0.0.0.0"

    heatershaker_proxy: ProxySettings = ProxySettings(
        emulator_port=9000, driver_port=9995
    )
    thermocycler_proxy: ProxySettings = ProxySettings(
        emulator_port=9002, driver_port=9997
    )
    temperature_proxy: ProxySettings = ProxySettings(
        emulator_port=9003, driver_port=9998
    )
    magdeck_proxy: ProxySettings = ProxySettings(emulator_port=9004, driver_port=9999)

    class Config:
        env_prefix = "OT_EMULATOR_"

    module_server: ModuleServerSettings = ModuleServerSettings()
