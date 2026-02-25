from pathlib import Path

import pytest

from system_server.system.oem_mode.oem_settings_store import (
    OEMSettings,
    OEMSettingsStore,
)


def test_default(tmp_path: Path) -> None:
    subject = OEMSettingsStore(tmp_path)
    assert subject.read() == OEMSettings(
        oem_mode_enabled=False, oem_mode_splash_custom=None
    )


@pytest.mark.parametrize(
    "settings",
    [
        OEMSettings(oem_mode_enabled=False, oem_mode_splash_custom=None),
        OEMSettings(oem_mode_enabled=True, oem_mode_splash_custom=None),
        OEMSettings(oem_mode_enabled=True, oem_mode_splash_custom="/foo/bar.png"),
        OEMSettings(oem_mode_enabled=True, oem_mode_splash_custom="/foo/bar.png"),
    ],
)
def test_write_read_round_trip(settings: OEMSettings, tmp_path: Path) -> None:
    subject = OEMSettingsStore(tmp_path)
    subject.write(settings)
    assert subject.read() == settings
