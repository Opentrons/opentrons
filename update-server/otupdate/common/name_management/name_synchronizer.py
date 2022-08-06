from __future__ import annotations

from contextlib import asynccontextmanager
from logging import getLogger
from typing import AsyncGenerator, Optional

from aiohttp import web

from otupdate.common.constants import APP_VARIABLE_PREFIX
from .avahi import AvahiClient, alternative_service_name
from .pretty_hostname import get_pretty_hostname, persist_pretty_hostname


_NAME_SYNCHRONIZER_VARNAME = APP_VARIABLE_PREFIX + "name_synchronizer"
_log = getLogger(__name__)


class NameSynchronizer:
    """Keep the machine's human-readable names in sync with each other.

    This ties the pretty hostname and the Avahi service name together,
    so they always have the same value.

    The `set_name()` and `get_name()` methods are intended for use by HTTP
    endpoints, which makes for a total of three names tied together,
    if you also count the name available over HTTP.

    See the `name_management` package docstring for an overview of these various names.

    We tie all of these names together because:

    * It's important to avoid confusing the client-side discovery client,
      at least at the time of writing.
      https://github.com/Opentrons/opentrons/issues/10199

    * It helps maintain a conceptually simple interface.
      There is one name accessible in three separate ways,
      rather than three separate names.

    * It implements the DNS-SD spec's recommendation to make the DNS-SD instance name
      configurable. https://datatracker.ietf.org/doc/html/rfc6763#section-4.1.1
    """

    def __init__(self, avahi_client: AvahiClient) -> None:
        """For internal use by this class only. Use `start()` instead."""
        self._avahi_client = avahi_client

    @classmethod
    @asynccontextmanager
    async def start(
        cls, avahi_client: Optional[AvahiClient] = None
    ) -> AsyncGenerator[NameSynchronizer, None]:
        """Build a NameSynchronizer and keep it running in the background.

        Avahi advertisements will start as soon as this context manager is entered.
        The pretty hostname will be used as the Avahi service name.

        While this context manager remains entered, Avahi will be monitored in the
        background to see if this device's name ever collides with another device on
        the network. If that ever happens, a new name will be chosen automatically,
        which will be visible through `get_name()`.

        Collision monitoring will stop when this context manager exits.

        Args:
            avahi_client: The interface for communicating with Avahi.
                Changeable for testing this class; should normally be left as
                the default.
        """
        if avahi_client is None:
            avahi_client = await AvahiClient.connect()

        name_synchronizer = cls(avahi_client)
        async with avahi_client.listen_for_collisions(
            callback=name_synchronizer._on_avahi_collision
        ):
            await avahi_client.start_advertising(
                service_name=await name_synchronizer.get_name()
            )
            yield name_synchronizer

    async def set_name(self, new_name: str) -> str:
        """Set the machine's human-readable name.

        This first sets the Avahi service name, and then persists it
        as the pretty hostname.

        Returns the new name. This is normally the same as the requested name,
        but it it might be different if it had to be truncated, sanitized, etc.
        """
        await self._avahi_client.start_advertising(service_name=new_name)
        # Setting the Avahi service name can fail if Avahi doesn't like the new name.
        # Persist only after it succeeds, so we don't persist something invalid.
        persisted_pretty_hostname = await persist_pretty_hostname(new_name)
        _log.info(
            f"Changed name to {repr(new_name)}"
            f" (persisted {repr(persisted_pretty_hostname)})."
        )
        return persisted_pretty_hostname

    async def get_name(self) -> str:
        """Return the machine's current human-readable name.

        Note that this can change even if you haven't called `set_name()`,
        if it was necessary to avoid conflicts with other devices on the network.
        """
        return await get_pretty_hostname()

    async def _on_avahi_collision(self) -> None:
        current_name = await self.get_name()

        # Assume that the service name was the thing that collided.
        # Theoretically it also could have been the static hostname,
        # but our static hostnames are unique in practice, so that's unlikely.
        alternative_name = alternative_service_name(current_name)
        _log.info(
            f"Name collision detected by Avahi."
            f" Changing name from {repr(current_name)} to {repr(alternative_name)}."
        )

        # Setting the new name includes persisting it for the next boot.
        #
        # Persisting the new name is recommended in the mDNS spec
        # (https://datatracker.ietf.org/doc/html/rfc6762#section-9).
        # It prevents two machines with the same name from flipping
        # which one is #1 and which one is #2 every time they reboot.
        await self.set_name(new_name=alternative_name)


def install_name_synchronizer(
    name_synchronizer: NameSynchronizer, app: web.Application
) -> None:
    """Install a NameSynchronizer on `app` for later retrieval
    via get_name_synchronizer().

    This should be done as part of server startup.
    """
    app[_NAME_SYNCHRONIZER_VARNAME] = name_synchronizer


def get_name_synchronizer(request: web.Request) -> NameSynchronizer:
    """Return the server's singleton NameSynchronizer from a request.

    The singleton NameSynchronizer is expected to have been installed on the
    aiohttp.Application already via install_name_synchronizer().
    """
    name_synchronizer = request.app.get(_NAME_SYNCHRONIZER_VARNAME, None)
    assert isinstance(
        name_synchronizer, NameSynchronizer
    ), f"Unexpected type {type(name_synchronizer)}. Incorrect Application setup?"
    return name_synchronizer
