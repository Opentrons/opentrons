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


@pytest.mark.parametrize(
    ("settings", "expected_file_contents"),
    [
        (
            OEMSettings(oem_mode_enabled=False, oem_mode_splash_custom=None),
            """\
OT_SYSTEM_SERVER_oem_mode_enabled='False'
OT_SYSTEM_SERVER_oem_mode_splash_custom=''
""",
        ),
        (
            OEMSettings(oem_mode_enabled=True, oem_mode_splash_custom="/foo/bar.png"),
            """\
OT_SYSTEM_SERVER_oem_mode_enabled='True'
OT_SYSTEM_SERVER_oem_mode_splash_custom='/foo/bar.png'
""",
        ),
    ],
)
def test_write(
    settings: OEMSettings, expected_file_contents: str, tmp_path: Path
) -> None:
    """It should write to the format expected by external shell scripts."""
    subject = OEMSettingsStore(tmp_path)
    subject.write(settings)
    assert (tmp_path / "system.env").read_text() == expected_file_contents


@pytest.mark.parametrize(
    ("file_contents", "expected_settings"),
    [
        (
            """\
OT_SYSTEM_SERVER_some_old_stray_setting='/#$!etfya8 sf23l asz"'
OT_SYSTEM_SERVER_oem_mode_enabled='False'
OT_SYSTEM_SERVER_oem_mode_splash_custom=''
""",
            OEMSettings(oem_mode_enabled=False, oem_mode_splash_custom=None),
        ),
        (
            """\
OT_SYSTEM_SERVER_some_old_stray_setting='/#$!etfya8 sf23l asz"'
OT_SYSTEM_SERVER_oem_mode_enabled='True'
OT_SYSTEM_SERVER_oem_mode_splash_custom='/foo/bar.png'
""",
            OEMSettings(oem_mode_enabled=True, oem_mode_splash_custom="/foo/bar.png"),
        ),
    ],
)
def test_read(
    file_contents: str, expected_settings: OEMSettings, tmp_path: Path
) -> None:
    """It should be able to read files created by older server versions.

    Unrecognized settings should be ignored.
    """
    (tmp_path / "system.env").write_text(file_contents)
    subject = OEMSettingsStore(tmp_path)
    assert subject.read() == expected_settings
