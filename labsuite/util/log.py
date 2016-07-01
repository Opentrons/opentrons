import logging
import labsuite
import os

filename = os.path.join(
    os.path.dirname(labsuite.__file__),
    '..',
    'logs',
    'operation_log.log'
)

f = open(filename)
f.close()

logging.basicConfig(
    filename=filename,
    level=logging.DEBUG,
    format='%(asctime)s %(levelname)-8s %(message)s',
    datefmt='%d-%m-%y %H:%M:%S',
)


def debug(system, message):
    logging.debug("[{}] {}".format(system, message))


def info(system, message):
    logging.info("[{}] {}".format(system, message))
