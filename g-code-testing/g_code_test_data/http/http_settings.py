from typing_extensions import Final
from opentrons.hardware_control.emulation.settings import (
    Settings, SmoothieSettings, PipetteSettings
)


HTTP_SETTINGS = Settings(
    smoothie=SmoothieSettings(
        left=PipetteSettings(model="p20_single_v2.0", id="P20SV202020070101"),
        right=PipetteSettings(model="p300_single_v2.1", id="P20SV202020070101")
    )
)


S3_BASE: Final = "http"
"""Base of files in s3"""
