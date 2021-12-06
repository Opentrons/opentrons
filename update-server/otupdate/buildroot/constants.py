""" Constants for the buildroot implementation to avoid circular deps """

APP_VARIABLE_PREFIX = "com.opentrons.otupdate.buildroot."
#: Prefix for variables in the aiohttp.web.Application dictlike

RESTART_LOCK_NAME = APP_VARIABLE_PREFIX + "restartlock"
#: Name for the asyncio lock in the application dictlike

DEVICE_NAME_VARNAME = APP_VARIABLE_PREFIX + "name"
#: Name for the device

DEVICE_BOOT_ID_NAME = APP_VARIABLE_PREFIX + "boot_id"
#: A random string that changes every time the device boots.
#:
#: Clients can poll this to detect when the OT-2 has rebooted. (Including both
#: graceful reboots, like from clicking the soft "Restart" button, and
#: unexpected reboots, like from interrupting the power supply).
#:
#: There are no guarantees about the returned ID's length or format. Equality
#: comparison with other IDs returned from this endpoint is the only valid
#: thing to do with it.
#:
#: This ID only changes when the whole OT-2 operating system reboots.
#: It doesn't change if some internal process merely crashes and restarts.
