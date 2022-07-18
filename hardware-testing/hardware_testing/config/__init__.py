from dataclasses import dataclass


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
    data: DataConfigTest
    photo: bool
    grav: bool
    start_tip: str
    baseline: bool
    plate_on_scale: bool
    volume: float
    num_samples: int
    plate_rows: str
    trough_cols: str
    inspect: bool
    measure_evaporation: bool


def default_config() -> ConfigTest:
    return ConfigTest(
        pipette=PipetteConfigTest(change_tip=True, use_trash=True),
        scale=ScaleConfigTest(run=True, use_lid=False, safe_z_offset=0),
        data=DataConfigTest(directory="."),
        photo=True,
        grav=True,
        start_tip="A1",
        baseline=False,
        plate_on_scale=False,
        volume=200,
        num_samples=12,
        plate_rows="A",
        trough_cols="1",
        inspect=False,
        measure_evaporation=False,
    )
