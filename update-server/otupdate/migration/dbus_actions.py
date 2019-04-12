""" Methods and classes to manipulate the balena host systemd via dbus

The methods used here are the systemd pid1 dbus management interface described
at https://www.freedesktop.org/wiki/Software/systemd/dbus/

These methods are used to do things like unmount the inactive sysroot so we can
write to its block device without trashing everything.
"""
import contextlib
import logging

_INTERFACE = None

_SYSROOT_INACTIVE_UNIT = 'mnt-sysroot-inactive.mount'
_BOOT_UNIT = 'mnt-boot.mount'

LOG = logging.getLogger(__name__)


def interface():
    global _INTERFACE
    if not _INTERFACE:
        # dbus is imported inline and not listed in our pipfile because
        # - it doesn’t exist on non-linux systems
        # - it seems like a really bad idea to even have the possibility
        #   to start mucking around with some poor unaware contributor’s
        #   mount units
        import dbus
        bus = dbus.SystemBus()
        obj = bus.get_object(
            'org.freedesktop.systemd1', '/org/freedesktop/systemd1')
        _INTERFACE = dbus.Interface(
            obj, dbus_interface='org.freedesktop.systemd1.Manager')
    return _INTERFACE


def set_mounted(unitname: str, mounted: bool, swallow_exc: bool = False):
    """ Mount or unmount a unit.

    Worker for the contextlibs

    :param unitname: The systemd unit for the mount to affect. This probably
                     should be one of :py:attr:`_SYSROOT_INACTIVE_UNIT` or
                     :py:attr:`_BOOT_UNIT` but it could be anything
    :param mounted: ``True`` to start the mount unit, ``False`` to stop it
    :param swallow_exc: ``True`` to capture all exceptions, ``False`` to pass
                        them upwards. This is useful for when you don't super
                        care about the success of the mount, like when trying
                        to restore the system after you write the boot part
    """
    try:
        if mounted:
            LOG.info(f"Starting {unitname}")
            interface().StartUnit(unitname, 'replace')
            LOG.info(f"Started {unitname}")
        else:
            LOG.info(f"Stopping {unitname}")
            interface().StopUnit(unitname, 'replace')
            LOG.info(f"Stopped {unitname}")
    except Exception:
        LOG.info(
            f"Exception {'starting' if mounted else 'stopping'} {unitname}")
        if not swallow_exc:
            raise


@contextlib.contextmanager
def unmount_boot():
    """ Unmount the balena host boot partition mount while in the context """
    set_mounted(_BOOT_UNIT, False)
    try:
        yield
    finally:
        set_mounted(_BOOT_UNIT, True, True)


@contextlib.contextmanager
def unmount_sysroot_inactive():
    """
    Unmount the balena host inactive sysroot partition mount while in the
    context
    """
    set_mounted(_SYSROOT_INACTIVE_UNIT, False)
    try:
        yield
    finally:
        set_mounted(_SYSROOT_INACTIVE_UNIT, True, True)


def restart():
    """ Restart through systemd in case the supervisor is dead
    """
    interface().Reboot()
