from opentrons.hardware_control.modules.mod_abc import AbstractModule


def require_live_data_real_string(module: AbstractModule) -> None:
    assert type(module.live_data["status"]) is str
    data = module.live_data["data"]
    assert data is not None
    for k, v in data.items():
        assert v is None or type(v) in (
            str,
            float,
            int,
            bool,
        ), (
            f"module {type(module)} live data key {k} has value {v} of type {type(v)}, must be POD"
        )
