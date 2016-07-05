import logging
import labsuite
import os


def set_log_file(filename):
    """
    Convenience method to set a log file along with default parameters
    provided by this module.

    logging.basicConfig can always be used on its own to specify any logging
    conditions desired.
    """
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s %(levelname)-8s %(message)s',
        datefmt='%d-%m-%y %H:%M:%S',
        filename=filename
    )


def debug(system, message):
    logging.debug("[{}] {}".format(system, message))


def info(system, message):
    logging.info("[{}] {}".format(system, message))


def error(system, message):
    logging.error("[{}] {}".format(system, message))


def warn(system, message):
    logging.warning("[{}] {}".format(system, message))


log_path = os.path.join(
    os.path.dirname(labsuite.__file__),
    '..',
    'logs'
)

if os.path.isdir(log_path):
    set_log_file(os.path.join(log_path, 'opentrons.log'))
