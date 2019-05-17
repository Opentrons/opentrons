import os
import logging
import asyncio
import re
from opentrons import HERE
from opentrons import server
from opentrons.server.main import build_arg_parser
from argparse import ArgumentParser
from opentrons import hardware, __version__
from opentrons.config import feature_flags as ff, name
from opentrons.system import udev, resin
from opentrons.util import logging_config

log = logging.getLogger(__name__)


def _find_smoothie_file():
    resources = os.listdir(os.path.join(HERE, 'resources'))
    for fi in resources:
        matches = re.search('smoothie-(.*).hex', fi)
        if matches:
            branch_plus_ref = matches.group(1)
            return os.path.join(HERE, 'resources', fi), branch_plus_ref
    raise OSError("Could not find smoothie firmware file in {}"
                  .format(os.path.join(HERE, 'resources')))


def _sync_do_smoothie_install(explicit_modeset, filename, loop):
    loop.run_until_complete(hardware.update_firmware(filename,
                                                     loop,
                                                     explicit_modeset))


def initialize_robot(loop):
    packed_smoothie_fw_file, packed_smoothie_fw_ver = _find_smoothie_file()
    try:
        if ff.use_protocol_api_v2():
            hardware.connect(force=True)
        else:
            hardware.connect()
    except Exception as e:
        # The most common reason for this exception (aside from hardware
        # failures such as a disconnected smoothie) is that the smoothie
        # is in programming mode. If it is, then we still want to update
        # it (so it can boot again), but we don’t have to do the GPIO
        # manipulations that _put_ it in programming mode
        log.exception("Error while connecting to motor driver: {}".format(e))
        explicit_modeset = False
        fw_version = None
    else:
        explicit_modeset = True
        fw_version = hardware.fw_version
    log.info("Smoothie FW version: {}".format(fw_version))
    if fw_version != packed_smoothie_fw_ver:
        log.info("Executing smoothie update: current vers {}, packed vers {}"
                 .format(fw_version, packed_smoothie_fw_ver))
        for attempts in range(3):
            try:
                loop.run_until_complete(
                    hardware.update_firmware(
                        packed_smoothie_fw_file,
                        explicit_modeset=explicit_modeset))
            except RuntimeError:
                explicit_modeset = True
                continue

            if hardware.is_connected():
                log.info(f"Smoothie fw update complete in {attempts} tries")
                break
            else:
                log.error(
                    "Failed to update smoothie: did not connect after update")
        else:
            log.error("Could not update smoothie, forcing virtual")
            os.environ['ENABLE_VIRTUAL_SMOOTHIE'] = 'true'
            hardware.connect()
    else:
        log.info("FW version OK: {}".format(packed_smoothie_fw_ver))
    log.info(f"Name: {name()}")


def run(**kwargs):
    """
    This function was necessary to separate from main() to accommodate for
    server startup path on system 3.0, which is server.main. In the case where
    the api is on system 3.0, server.main will redirect to this function with
    an additional argument of 'patch_old_init'. kwargs are hence used to allow
    the use of different length args
    """
    logging_config.log_init(hardware.config.log_level)
    loop = asyncio.get_event_loop()
    log.info("API server version:  {}".format(__version__))
    if not os.environ.get("ENABLE_VIRTUAL_SMOOTHIE"):
        initialize_robot(loop)
        if ff.use_protocol_api_v2():
            loop.run_until_complete(hardware.cache_instruments())
        if not ff.disable_home_on_boot():
            log.info("Homing Z axes")
            if ff.use_protocol_api_v2():
                loop.run_until_complete(hardware.home_z())
            else:
                hardware.home_z()
        try:
            udev.setup_rules_file()
        except Exception:
            log.exception(
                "Could not setup udev rules, modules may not be detected")
    # Explicitly unlock resin updates in case a prior server left them locked
    resin.unlock_updates()

    server.run(kwargs.get('hostname'), kwargs.get('port'), kwargs.get('path'),
               loop)


def main():
    """ The main entrypoint for the Opentrons robot API server stack.

    This function
    - creates and starts the server for both the RPC routes
      handled by :py:mod:`opentrons.server.rpc` and the HTTP routes handled
      by :py:mod:`opentrons.server.http`
    - initializes the hardware interaction handled by either
      :py:mod:`opentrons.legacy_api` or :py:mod:`opentrons.hardware_control`

    This function does not return until the server is brought down.
    """

    arg_parser = ArgumentParser(
        description="Opentrons robot software",
        parents=[build_arg_parser()])
    args = arg_parser.parse_args()
    run(**vars(args))
    arg_parser.exit(message="Stopped\n")


if __name__ == "__main__":
    main()
