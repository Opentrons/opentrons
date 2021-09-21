from opentrons.hardware_control.emulation.settings import Settings, SmoothieSettings


HTTP_SETTINGS = Settings(
    smoothie=SmoothieSettings(
        left={"model": "p20_single_v2.0", "id": "P20SV202020070101"},
        right={"model": "p300_single_v2.1", "id": "P20SV202020070101"}
    )
)
