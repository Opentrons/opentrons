import os
import logging
import asyncio
import re
from opentrons import HERE
from opentrons import server
from opentrons.server.main import build_arg_parser
from opentrons.server.endpoints import update
from argparse import ArgumentParser
from opentrons import robot, __version__
from opentrons.config import feature_flags as ff
from logging.config import dictConfig
from opentrons.util import environment
from opentrons.system import udev, resin

log = logging.getLogger(__name__)
log_file_path = environment.get_path('LOG_DIR')


def log_init():
    """
    Function that sets log levels and format strings. Checks for the
    OT_LOG_LEVEL environment variable otherwise defaults to DEBUG.
    """
    fallback_log_level = 'INFO'
    ot_log_level = robot.config.log_level
    if ot_log_level not in logging._nameToLevel:
        log.info("OT Log Level {} not found. Defaulting to {}".format(
            ot_log_level, fallback_log_level))
        ot_log_level = fallback_log_level

    level_value = logging._nameToLevel[ot_log_level]

    serial_log_filename = environment.get_path('SERIAL_LOG_FILE')
    api_log_filename = environment.get_path('LOG_FILE')

    logging_config = dict(
        version=1,
        formatters={
            'basic': {
                'format':
                '%(asctime)s %(name)s %(levelname)s [Line %(lineno)s] %(message)s'  # noqa: E501
            }
        },
        handlers={
            'debug': {
                'class': 'logging.StreamHandler',
                'formatter': 'basic',
                'level': level_value
            },
            'serial': {
                'class': 'logging.handlers.RotatingFileHandler',
                'formatter': 'basic',
                'filename': serial_log_filename,
                'maxBytes': 5000000,
                'level': logging.DEBUG,
                'backupCount': 3
            },
            'api': {
                'class': 'logging.handlers.RotatingFileHandler',
                'formatter': 'basic',
                'filename': api_log_filename,
                'maxBytes': 1000000,
                'level': logging.DEBUG,
                'backupCount': 5
            }

        },
        loggers={
            '__main__': {
                'handlers': ['debug', 'api'],
                'level': logging.INFO
            },
            'opentrons.server': {
                'handlers': ['debug', 'api'],
                'level': level_value
            },
            'opentrons.api': {
                'handlers': ['debug', 'api'],
                'level': level_value
            },
            'opentrons.instruments': {
                'handlers': ['debug', 'api'],
                'level': level_value
            },
            'opentrons.robot.robot_configs': {
                'handlers': ['debug', 'api'],
                'level': level_value
            },
            'opentrons.drivers.smoothie_drivers.driver_3_0': {
                'handlers': ['debug', 'api'],
                'level': level_value
            },
            'opentrons.drivers.serial_communication': {
                'handlers': ['serial'],
                'level': logging.DEBUG
            }
        }
    )
    dictConfig(logging_config)


def _find_smoothie_file():
    resources = os.listdir(os.path.join(HERE, 'resources'))
    for fi in resources:
        matches = re.search('smoothie-(.*).hex', fi)
        if matches:
            branch_plus_ref = matches.group(1)
            return os.path.join(HERE, 'resources', fi), branch_plus_ref
    raise OSError("Could not find smoothie firmware file in {}"
                  .format(os.path.join(HERE, 'resources')))


def _sync_do_smoothie_install(explicit_modeset, filename):
    loop = asyncio.get_event_loop()
    loop.run_until_complete(update._update_firmware(filename,
                                                    loop,
                                                    explicit_modeset))


def initialize_robot():
    packed_smoothie_fw_file, packed_smoothie_fw_ver = _find_smoothie_file()
    try:
        robot.connect()
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
        fw_version = robot.fw_version

    if fw_version != packed_smoothie_fw_ver:
        log.info("Executing smoothie update: current vers {}, packed vers {}"
                 .format(fw_version, packed_smoothie_fw_ver))
        _sync_do_smoothie_install(explicit_modeset, packed_smoothie_fw_file)

        if robot.is_connected():
            robot.fw_version = robot._driver.get_fw_version()
            log.info("FW Update complete!")
        else:
            raise RuntimeError(
                "Could not connect to motor driver after fw update")

    else:
        log.info("FW version OK: {}".format(packed_smoothie_fw_ver))


def run(**kwargs):
    """
    This function was necessary to separate from main() to accommodate for
    server startup path on system 3.0, which is server.main. In the case where
    the api is on system 3.0, server.main will redirect to this function with
    an additional argument of 'patch_old_init'. kwargs are hence used to allow
    the use of different length args
    """
    log_init()
    try:
        robot.connect()
    except Exception as e:
        log.exception("Error while connecting to motor-driver: {}".format(e))

    log.info("API server version:  {}".format(__version__))
    log.info("Smoothie FW version: {}".format(robot.fw_version))

    if not os.environ.get("ENABLE_VIRTUAL_SMOOTHIE"):
        initialize_robot()

        if not ff.disable_home_on_boot():
            log.info("Homing Z axes")
            robot.home_z()
        udev.setup_rules_file()
    # Explicitly unlock resin updates in case a prior server left them locked
    resin.unlock_updates()

    server.run(kwargs.get('hostname'), kwargs.get('port'), kwargs.get('path'))


def main():
    """This application creates and starts the server for both the RPC routes
    handled by opentrons.server.rpc and HTTP endpoints defined here
    """

    arg_parser = ArgumentParser(
        description="Opentrons robot software",
        parents=[build_arg_parser()])
    args = arg_parser.parse_args()
    run(**vars(args))
    arg_parser.exit(message="Stopped\n")


if __name__ == "__main__":
    main()
