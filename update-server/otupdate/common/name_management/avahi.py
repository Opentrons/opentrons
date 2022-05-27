"""Control the Avahi daemon."""


import asyncio
from logging import getLogger
from typing import Optional


LOG = getLogger(__name__)


try:
    import dbus

    class DBusState:
        """Bundle of state for dbus"""

        def __init__(
            self,
            bus: dbus.SystemBus,
            server: dbus.Interface,
            entrygroup: dbus.Interface,
        ) -> None:
            """
            Build the state bundle.

            :param bus: The system bus instance
            :param server: An org.freedesktop.Avahi.Server interface
            :param entrygroup: An org.freedesktop.Avahi.EntryGroup interface
            """
            self.bus = bus
            #: The system bus
            self.entrygroup = entrygroup
            #: The entry group interface
            self.server = server
            #: The avahi server interface

    _BUS_STATE: Optional[DBusState] = None

    def _set_avahi_service_name_sync(new_service_name: str) -> None:
        """The synchronous implementation of setting the Avahi service name.

        The dbus module doesn't natively support async/await.
        """
        # For semantics of the methods we're calling, see Avahi's API docs.
        # For example: https://www.avahi.org/doxygen/html/index.html#good_publish
        # It's mostly in terms of the C API, but the semantics should be the same.
        #
        # For exact method names and argument types, see Avahi's D-Bus bindings,
        # which they specify across several machine-readable files. For example:
        # https://github.com/lathiat/avahi/blob/v0.7/avahi-daemon/org.freedesktop.Avahi.EntryGroup.xml
        global _BUS_STATE
        if not _BUS_STATE:
            bus = dbus.SystemBus()
            server_obj = bus.get_object("org.freedesktop.Avahi", "/")
            server_if = dbus.Interface(server_obj, "org.freedesktop.Avahi.Server")
            entrygroup_path = server_if.EntryGroupNew()
            entrygroup_obj = bus.get_object("org.freedesktop.Avahi", entrygroup_path)
            entrygroup_if = dbus.Interface(
                entrygroup_obj, "org.freedesktop.Avahi.EntryGroup"
            )
            _BUS_STATE = DBusState(bus, server_if, entrygroup_if)

        _BUS_STATE.entrygroup.Reset()

        hostname = _BUS_STATE.server.GetHostName()
        domainname = _BUS_STATE.server.GetDomainName()

        # TODO(mm, 2022-05-06): This isn't exception-safe.
        # Since we've already reset the entrygroup, if this fails
        # (for example because Avahi doesn't like the new name),
        # we'll be left with no entrygroup and Avahi will stop advertising the machine.
        _BUS_STATE.entrygroup.AddService(
            dbus.Int32(-1),  # avahi.IF_UNSPEC
            dbus.Int32(-1),  # avahi.PROTO_UNSPEC
            dbus.UInt32(0),  # flags
            new_service_name,  # sname
            "_http._tcp",  # stype
            domainname,  # sdomain (.local)
            f"{hostname}.{domainname}",  # shost (hostname.local)
            dbus.UInt16(31950),  # port
            dbus.Array([], signature="ay"),
        )
        _BUS_STATE.entrygroup.Commit()

        # TODO(mm, 2022-05-04): Recover from AVAHI_ENTRY_GROUP_COLLISION in case
        # this name collides with another device on the network.
        # https://github.com/Opentrons/opentrons/issues/10126

except ImportError:
    LOG.exception("Couldn't import dbus, name setting will be nonfunctional")

    def _set_avahi_service_name_sync(new_service_name: str) -> None:
        LOG.warning("Not setting name, dbus could not be imported")


_BUS_LOCK = asyncio.Lock()


async def set_avahi_service_name(new_service_name: str) -> None:
    """Set the Avahi service name.

    See the `name_management` package docstring for background on the service name
    and how it's distinct from other names on the machine.

    The new service name will only apply to the current boot.

    Avahi requires a service name.
    It will not advertise the system over mDNS + DNS-SD until one is set.

    Since the Avahi service name corresponds to the DNS-SD instance name,
    it's a human-readable string of mostly arbitrary Unicode,
    at most 63 octets (not 63 code points or 63 characters!) long.
    (See: https://datatracker.ietf.org/doc/html/rfc6763#section-4.1.1)
    Avahi will raise an error if it thinks the new service name is invalid.
    """
    async with _BUS_LOCK:
        await asyncio.get_event_loop().run_in_executor(
            None, _set_avahi_service_name_sync, new_service_name
        )
