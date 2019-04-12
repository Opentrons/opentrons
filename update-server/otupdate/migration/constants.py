""" Constants for the migration implementation to avoid circular deps """

APP_VARIABLE_PREFIX = 'com.opentrons.otupdate.migration.'
#: Prefix for variables in the aiohttp.web.Application dictlike

DATA_DIR_NAME = '/data'
#: Name of the directory to migrate data from

BOOT_PARTITION_NAME = '/dev/mmcblk0p1'
#: Name of the boot partition

ROBOT_NAME_VARNAME = APP_VARIABLE_PREFIX + 'robot_name'
