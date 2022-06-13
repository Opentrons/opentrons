"""Control the Avahi daemon."""


from __future__ import annotations

import asyncio
import contextlib
import logging
import re
from typing import AsyncGenerator, Awaitable, Callable, cast

try:
    import dbus

    _DBUS_AVAILABLE = True
except ImportError:
    _DBUS_AVAILABLE = False


_COLLISION_POLL_INTERVAL = 5

SERVICE_NAME_MAXIMUM_OCTETS = 63
"""The maximum length of an Avahi service name.

Measured in UTF-8 octets (bytes) -- not code points or characters!

This comes from the DNS-SD specification on instance names,
which Avahi service names correspond to, under the hood.
https://datatracker.ietf.org/doc/html/rfc6763#section-4.1.1
"""


_log = logging.getLogger(__name__)


async def restart_daemon() -> None:
    """Restart the system's Avahi daemon and wait for it to come back up."""
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
        sync_client = await asyncio.get_running_loop().run_in_executor(
            executor=None,
            func=_SyncClient.connect,
        )
        return cls(sync_client=sync_client)

    async def start_advertising(self, service_name: str) -> None:
        """Start advertising the machine over mDNS + DNS-SD.

        Since the Avahi service name corresponds to the DNS-SD instance name,
        it's a human-readable string of mostly arbitrary Unicode,
        at most SERVICE_NAME_MAXIMUM_OCTETS long.

        Avahi will raise an exception through this method if it thinks
        the new service name is invalid.

        Avahi will stop advertising the machine when either of these happen:

        * This process dies.
        * We have a name collision with another device on the network.
          See `listen_for_collisions()`.

        It's safe to call this more than once. If we're already advertising,
        the existing service name will be replaced with the new one.
        """
        async with self._lock:
            await asyncio.get_running_loop().run_in_executor(
                None, self._sync_client.start_advertising, service_name
            )

    @contextlib.asynccontextmanager
    async def listen_for_collisions(
        self, callback: CollisionCallback
    ) -> AsyncGenerator[None, None]:
        """Be informed of name collisions.

        Background:
        The Avahi service name and the static hostname that this client advertises
        must be unique on the network. When Avahi detects a collision, it will stop
        advertising until we fix the conflict by giving it a different name.

        While this context manager is entered, `callback()` will be called
        whenever a collision happens. You should then call `start_advertising()`
        with a new name to resume advertising.

        If `callback()` raises an exception, it's logged but otherwise ignored.
        """
        # Ideally, instead of polling, we'd listen to the EntryGroup.StateChanged
        # signal. But receiving signals through the dbus library requires a 3rd-party
        # event loop like GLib's.
        background_task = asyncio.create_task(
            self._poll_infinitely_for_collision(callback=callback)
        )

        try:
            yield
        finally:
            background_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await background_task

    async def _poll_infinitely_for_collision(self, callback: CollisionCallback) -> None:
        while True:
            is_collided = await self._is_collided()

            if is_collided:
                try:
                    await callback()
                except asyncio.CancelledError:
                    # If it raises CancelledError, this task is being cancelled.
                    # Let the CancelledError propagate and break the loop
                    # so we don't accidentally suppress the cancellation.
                    raise
                except Exception:
                    # If it raises any other Exception, it's unexpected.
                    # Log it and keep polling.
                    _log.exception("Exception while handling Avahi name collision.")

            await asyncio.sleep(_COLLISION_POLL_INTERVAL)

    async def _is_collided(self) -> bool:
        async with self._lock:
            return await asyncio.get_running_loop().run_in_executor(
                None, self._sync_client.is_collided
            )


CollisionCallback = Callable[[], Awaitable[None]]


# TODO(mm, 2022-06-08): Delegate to Avahi instead of implementing this ourselves
# when it becomes safe for our names to have spaces and number signs.
# See code history on https://github.com/Opentrons/opentrons/pull/10559.
def alternative_service_name(current_service_name: str) -> str:
    """Return an alternative to the given Avahi service name.

    This is useful for fixing name collisions with other things on the network.
    For example:

        alternative_service_name("Foo") == "FooNum2"
        alternative_service_name("FooNum2") == "FooNum3"

    Appending incrementing integers like this, instead of using something like
    the machine's serial number, follows a recommendation in the DNS-SD spec:
    https://datatracker.ietf.org/doc/html/rfc6763#appendix-D

    We use "Num" as a separator because:

    * Having some separator is good to avoid accidentally "incrementing" names that are
      serial numbers; we don't want OT2CEP20200827B10 to become OT2CEP20200827B11.

    * The Opentrons App is temporarily limiting user-input names to alphanumeric
      characters while other server-side bugs are being resolved.
      So, the names that we generate here should also be alphanumeric.
      https://github.com/Opentrons/opentrons/issues/10214

    * The number sign (#) character in particular breaks the Opentrons App,
      so we especially can't use that.
      https://github.com/Opentrons/opentrons/issues/10672
    """
    separator = "Num"

    pattern = f"(?P<base_name>.*){separator}(?P<sequence_number>[0-9]+)"
    match = re.fullmatch(pattern=pattern, string=current_service_name, flags=re.DOTALL)
    if match is None:
        base_name = current_service_name
        next_sequence_number = 2
    else:
        base_name = match["base_name"]
        next_sequence_number = int(match["sequence_number"]) + 1

    new_suffix = f"{separator}{next_sequence_number}"

    octets_needed_for_suffix = len(new_suffix.encode("utf-8"))
    octets_available_for_base_name = (
        SERVICE_NAME_MAXIMUM_OCTETS - octets_needed_for_suffix
    )

    if octets_available_for_base_name >= 0:
        truncated_base_name = _truncate_by_utf8_octets(
            s=base_name, maximum_utf8_octets=octets_available_for_base_name
        )
        result = f"{truncated_base_name}{new_suffix}"
    else:
        # Edge case: The sequence number was already so high, incrementing it added a
        # new digit that we don't have room for. Roll back to zero instead.
        result = f"{separator}0"

    assert len(result.encode("utf-8")) <= SERVICE_NAME_MAXIMUM_OCTETS
    return result


def _truncate_by_utf8_octets(s: str, maximum_utf8_octets: int) -> str:
    """Truncate a string so it's no longer than the given number of octets when
    encoded as UTF-8.

    This takes care to avoid truncating in the middle of a multi-byte code point.
    So the output is always valid Unicode.

    However, it may split up multi-code-point sequences
    that a human would inituitively see as a single character.
    For example, it's possible to encode "é" as two code points:

    1. U+0061 Latin Small Letter E
    2. U+0306 Combining Acute Accent

    And this may truncate in between them, leaving an unaccented "e" in the output.
    (If we care to fix this, we should look into preserving grapheme clusters:
    https://unicode.org/reports/tr29/)
    """
    encoded = s.encode("utf-8")[:maximum_utf8_octets]
    return encoded.decode(
        "utf-8",
        # Silently discard any trailing junk left over
        # from truncating in the middle of a code point.
        errors="ignore",
    )


class _SyncClient:
    """A non-async wrapper around Avahi's D-Bus API.

    Since methods of this class do blocking I/O, they should be offloaded to a thread
    and not called directly inside an async event loop. But they're not safe to call
    concurrently from multiple threads, so the calls should be serialized with a lock.
    """

    # For general semantics of the methods we're calling on dbus proxies,
    # see Avahi's API docs. For example:
    # https://www.avahi.org/doxygen/html/index.html#good_publish
    # It's mostly in terms of the C API, but the semantics should be the same.

    # For exact method names and argument types, see Avahi's D-Bus bindings,
    # which they specify across several XML files. For example:
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
        # TODO(mm, 2022-05-26): Can we leave these as the empty string?
        # The avahi_entry_group_add_service() C API recommends passing NULL
        # to let the daemon decide these values.
        hostname = self._server.GetHostName()
        domainname = self._server.GetDomainName()

        self._entry_group.Reset()

        # TODO(mm, 2022-05-06): Can this be made exception-safe?
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

        self._entry_group.Commit()

    def is_collided(self) -> bool:
        state = self._entry_group.GetState()

        # "3" comes from AVAHI_ENTRY_GROUP_COLLISION being index 3 in this enum:
        # https://github.com/lathiat/avahi/blob/v0.8/avahi-common/defs.h#L234
        avahi_entry_group_collision = dbus.Int32(3)

        # Cast for when type-checking is run on dev machines without dbus,
        # where the type-checker will see this expression as `Any == Any`.
        return cast(bool, state == avahi_entry_group_collision)
