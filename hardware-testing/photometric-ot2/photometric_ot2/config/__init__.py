from dataclasses import dataclass
from typing import Optional


@dataclass
class PipetteConfigTest:
    change_tip: bool
    use_trash: bool


@dataclass
class ScaleConfigTest:
    run: bool
    use_lid: bool
    safe_z_offset: int


@dataclass
class DataConfigTest:
    directory: str


@dataclass
class ConfigTest:
    pipette: PipetteConfigTest
    scale: ScaleConfigTest
    scale_baud: int
    data: DataConfigTest
    photo: bool
    grav: bool
    start_tip: str
    baseline: bool
    plate_on_scale: bool
    use_multi: bool
    volume: float
    num_samples: int
    plate_rows: str
    trough_cols: str
    inspect: bool
    measure_evaporation: bool
    retract: float
    has_diluent: bool
    pip_mount: str
    pip_size: int
    multi_mount: Optional[str]
    multi_size: int
    hv_divide: int
    auto_offset: bool


def default_config() -> ConfigTest:
    return ConfigTest(
        pipette=PipetteConfigTest(
            change_tip=False,
            use_trash=True
        ),
        scale=ScaleConfigTest(
            run=True,
            use_lid=False,
            safe_z_offset=0
        ),
        data=DataConfigTest(
            directory='.'
        ),
        scale_baud=9600,
        photo=True,
        grav=True,
        start_tip='A1',
        baseline=True,
        plate_on_scale=False,
        use_multi=False,
        volume=200,
        num_samples=12,
        plate_rows='A',
        trough_cols='1',
        inspect=False,
        measure_evaporation=False,
        retract=0.0,
        has_diluent=False,
        pip_mount="right",
        pip_size=300,
        multi_mount="left",
        multi_size=300,
        hv_divide=0,
        auto_offset=True,
    )
