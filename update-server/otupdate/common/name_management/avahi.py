"""Control the Avahi daemon."""


from __future__ import annotations

import abc
import asyncio
import contextlib
import logging
from typing import AsyncGenerator, Awaitable, Callable, Optional, cast


_COLLISION_POLL_INTERVAL = 5


_log = logging.getLogger(__name__)


async def restart_daemon() -> None:
    proc = await asyncio.create_subprocess_exec(
        "systemctl",
        "restart",
        "avahi-daemon",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()
    ret = proc.returncode
    if ret != 0:
        _log.error(
            f"Error restarting avahi-daemon: {ret} "
            f"stdout: {stdout!r} stderr: {stderr!r}"
        )
        raise RuntimeError("Error restarting avahi")


class AvahiClient:
    def __init__(self, sync_client: _SyncClient) -> None:
        """For internal use by this class only. Use `connect()` instead."""
        self._sync_client = sync_client
        self._lock = asyncio.Lock()

    @classmethod
    async def connect(cls) -> AvahiClient:
        # TODO: Handle case when dbus isn't available.
        sync_client = await asyncio.get_running_loop().run_in_executor(
            executor=None,
            func=_SyncClient.connect,
        )
        return cls(sync_client=sync_client)

    async def start_advertising(self, service_name: str) -> None:
        """
        To document:
        * Picks up current static hostname and domain
        * Replaces an existing advertisement if there is one
        * Advertisement will automatically stop upon collision
        """
        async with self._lock:
            await asyncio.get_running_loop().run_in_executor(
                None, self._sync_client.start_advertising, service_name
            )

    async def alternative_service_name(self, current_service_name: str) -> str:
        async with self._lock:
            return await asyncio.get_running_loop().run_in_executor(
                None, self._sync_client.alternative_service_name, current_service_name
            )
        # Also document why we ask Avahi to do this for us.
        # Test whether Avahi gracefully handles overlong names.

    @contextlib.asynccontextmanager
    async def collision_callback(
        self, callback: CollisionCallback
    ) -> AsyncGenerator[None, None]:
        """
        To document:
        * Potentially duplicate collision events if resolving a collision takes too long
        * May cancel callback when this exits
        """

        async def _poll_and_call_back() -> None:
            _log.info("Beginning polling.")
            while True:
                if await self._is_collided():
                    await callback()  # TODO: Log exception?
                await asyncio.sleep(_COLLISION_POLL_INTERVAL)

        background_task = asyncio.create_task(_poll_and_call_back())

        try:
            yield

        finally:
            background_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await background_task

    async def _is_collided(self) -> bool:
        async with self._lock:
            return await asyncio.get_running_loop().run_in_executor(
                None, self._sync_client.is_collided
            )


CollisionCallback = Callable[[], Awaitable[None]]


try:
    import dbus
except ImportError:
    _avahi_available = False
else:
    _avahi_available = True

    class _SyncClient:
        """
        To document:
        Does I/O and is not thread-safe.
        dbus module doesn't natively support async/await.
        """

        # For semantics of the methods we're calling, see Avahi's API docs.
        # For example: https://www.avahi.org/doxygen/html/index.html#good_publish
        # It's mostly in terms of the C API, but the semantics should be the same.
        #
        # For exact method names and argument types, see Avahi's D-Bus bindings,
        # which they specify across several machine-readable files. For example:
        # https://github.com/lathiat/avahi/blob/v0.7/avahi-daemon/org.freedesktop.Avahi.EntryGroup.xml
        def __init__(
            self,
            bus: dbus.SystemBus,
            server: dbus.Interface,
            entry_group: dbus.Interface,
        ) -> None:
            """For internal use by this class only. Use `connect()` instead.

            Args:
                bus: The system bus instance.
                server: An org.freedesktop.Avahi.Server interface.
                entry_group: An org.freedesktop.Avahi.EntryGroup interface.
            """
            self._bus = bus
            self._server = server
            self._entry_group = entry_group

        @classmethod
        def connect(cls) -> _SyncClient:
            _log.info("Connecting to Avahi daemon.")

            bus = dbus.SystemBus()
            server_obj = bus.get_object("org.freedesktop.Avahi", "/")
            server_if = dbus.Interface(server_obj, "org.freedesktop.Avahi.Server")
            entry_group_path = server_if.EntryGroupNew()
            entry_group_obj = bus.get_object("org.freedesktop.Avahi", entry_group_path)
            entry_group_if = dbus.Interface(
                entry_group_obj, "org.freedesktop.Avahi.EntryGroup"
            )
            return cls(
                bus=bus,
                server=server_if,
                entry_group=entry_group_if,
            )

        def start_advertising(self, service_name: str) -> None:
            _log.info(f"Starting advertising with name {service_name}.")
            # TODO(mm, 2022-05-26): Can we leave these as the empty string?
            # The avahi_entry_group_add_service() C API recommends passing NULL
            # to let the daemon decide these values.
            hostname = self._server.GetHostName()
            domainname = self._server.GetDomainName()

            self._entry_group.Reset()
            _log.info(f"Reset entry group.")

            # TODO(mm, 2022-05-06): This isn't exception-safe.
            # We've already reset the entry group, so if this fails
            # (for example because Avahi doesn't like the new name),
            # we'll be left with no entry group,
            # and Avahi will stop advertising the machine.
            self._entry_group.AddService(
                dbus.Int32(-1),  # avahi.IF_UNSPEC
                dbus.Int32(-1),  # avahi.PROTO_UNSPEC
                dbus.UInt32(0),  # flags
                service_name,  # sname
                "_http._tcp",  # stype
                domainname,  # sdomain (.local)
                f"{hostname}.{domainname}",  # shost (hostname.local)
                dbus.UInt16(31950),  # port
                dbus.Array([], signature="ay"),
            )

            _log.info(f"Added service with {hostname} {domainname}.")

            self._entry_group.Commit()

            _log.info(f"Committed.")

        def alternative_service_name(self, current_service_name: str) -> str:
            result = self._server.GetAlternativeServiceName(current_service_name)
            assert isinstance(result, str)
            return result

        def is_collided(self) -> bool:
            """
            To document:
            Will be the case if another device on the network has
            the same service name or host.
            """

            state = self._entry_group.GetState()

            # The value 3 comes from:
            # https://github.com/lathiat/avahi/blob/v0.8/avahi-common/defs.h#L234
            avahi_entry_group_collision = dbus.Int32(3)

            return cast(bool, state == avahi_entry_group_collision)
