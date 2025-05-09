"""Test Grav LPC API Level."""
import importlib
import pkgutil
from typing import List, Tuple

from opentrons.protocols.api_support.definitions import MAX_SUPPORTED_VERSION

from hardware_testing.protocols.gravimetric_lpc import gravimetric


def test_protocol_versions_are_latest() -> None:
    """All Gravimetric protocols should use latest API version."""
    all_grav_lpc_protocols = [
        name
        for _, name, is_pkg in pkgutil.iter_modules(gravimetric.__path__)
        if not is_pkg
    ]

    # NOTE: (sigler) it may be the case that for specific protocols we could want to
    #       leave them tied to specific API level. HOWEVER, we should by DEFAULT be
    #       testing with the latest API level in the absence of any good reason not to.
    expected_version = str(MAX_SUPPORTED_VERSION)

    failures: List[Tuple[str, str, str]] = []
    for protocol_name in all_grav_lpc_protocols:
        protocol_name_as_module = (
            f"hardware_testing.protocols.gravimetric_lpc.gravimetric.{protocol_name}"
        )
        protocol = importlib.import_module(protocol_name_as_module)
        protocol_api_level = protocol.requirements["apiLevel"]
        if not protocol_api_level == expected_version:
            failures.append((protocol_name, protocol_api_level, expected_version))
    if len(failures):
        error_msg = (
            f"{len(failures)} gravimetric protocols do not have expected API level: "
        )
        error_msg += ",".join([f"{f[0]}({f[1]}!={f[2]})" for f in failures])
        raise ValueError(error_msg)
