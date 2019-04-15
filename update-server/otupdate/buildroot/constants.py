""" Constants for the buildroot implementation to avoid circular deps """

APP_VARIABLE_PREFIX = 'com.opentrons.otupdate.buildroot.'
#: Prefix for variables in the aiohttp.web.Application dictlike

RESTART_LOCK_NAME = APP_VARIABLE_PREFIX + 'restartlock'
#: Name for the asyncio lock in the application dictlike

DEVICE_HOSTNAME_VARNAME = APP_VARIABLE_PREFIX + 'hostname'
#: Hostname for the device

DEVICE_PRETTYNAME_VARNAME = APP_VARIABLE_PREFIX + 'prettyname'
#: Name for the device
