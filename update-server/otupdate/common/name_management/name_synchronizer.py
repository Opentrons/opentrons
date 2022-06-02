from __future__ import annotations

from abc import ABC, abstractmethod
from contextlib import asynccontextmanager
from logging import getLogger
from typing import AsyncGenerator, Optional

from aiohttp import web

from otupdate.common.constants import APP_VARIABLE_PREFIX
from .avahi import AvahiClient
from .pretty_hostname import get_pretty_hostname, persist_pretty_hostname


_NAME_SYNCHRONIZER_VARNAME = APP_VARIABLE_PREFIX + "name_synchronizer"
_log = getLogger(__name__)


class NameSynchronizer(ABC):
    """Keep the machine's human-readable names in sync with each other.

    This ties the pretty hostname and the Avahi service name together,
    so they always have the same value.

    The `set_name()` and `get_name()` methods are intended for use by HTTP
    endpoints, which makes for a total of three names tied together,
    if you also count the name available over HTTP.

    See the `name_management` package docstring for an overview of these various names.

    We tie all of these names together because

    * It's important to avoid confusing the client-side discovery client,
      at least at the time of writing.
      https://github.com/Opentrons/opentrons/issues/10199

    * It helps maintain a conceptually simple interface.
      There is one name accessible in three separate ways,
      rather than three separate names.

    * It implements the DNS-SD spec's recommendation to make the DNS-SD instance name
      configurable. https://datatracker.ietf.org/doc/html/rfc6763#section-4.1.1
    """

    @classmethod
    def from_request(cls, request: web.Request) -> NameSynchronizer:
        """Return the server's singleton NameSynchronizer from a request.

        The singleton NameSynchronizer is expected to have been installed on the
        aiohttp.Application already via `install_on_app()`.
        """
        name_synchronizer = request.app.get(_NAME_SYNCHRONIZER_VARNAME, None)
        assert isinstance(
            name_synchronizer, NameSynchronizer
        ), f"Unexpected type {type(name_synchronizer)}. Incorrect Application setup?"
        return name_synchronizer

    def install_on_app(self, app: web.Application) -> None:
        """Install this NameSynchronizer on `app` for later retrieval via
        `from_request()`.

        This should be done as part of server startup.
        """
        app[_NAME_SYNCHRONIZER_VARNAME] = self

    @abstractmethod
    async def set_name(self, new_name: str) -> str:
        """Set the machine's human-readable name.

        This first sets thhe Avahi service name, and then persists it
        as the pretty hostname.

        Returns the new name. This is normally the same as the requested name,
        but it it might be different if it had to be truncated, sanitized, etc.
        """

    @abstractmethod
    def get_name(self) -> str:
        """Return the machine's current human-readable name.

        Note that this can change even if you haven't called `set_name()`,
        if it was necessary to avoid conflicts with other devices on the network.
        """


class RealNameSynchronizer(NameSynchronizer):
    """A functioning implementation of NameSynchronizer, to run in production."""

    def __init__(self, avahi_client: AvahiClient) -> None:
        """For internal use by this class only. Use `build()` instead."""
        self._avahi_client = avahi_client

    @classmethod
    @asynccontextmanager
    async def build(
        cls, avahi_client: AvahiClient
    ) -> AsyncGenerator[NameSynchronizer, None]:
        """Build a RealNameSynchronizer and keep it running in the background.

        Avahi advertisements will start as soon as this context manager is entered.
        The pretty hostname will be used as the Avahi service name.

        While this context manager remains entered, Avahi will be monitored in the
        background to see if this device's name ever collides with another device on
        the network. If that ever happens, a new name will be chosen automatically,
        which will be visible through `get_name()`.

        Collision monitoring will stop when this context manager exits.
        """
        name_synchronizer = cls(avahi_client)
        async with avahi_client.collision_callback(
            name_synchronizer._on_avahi_collision
        ):
            await avahi_client.start_advertising(
                service_name=name_synchronizer.get_name()
            )
            yield name_synchronizer

    async def set_name(self, new_name: str) -> str:
        await self._avahi_client.start_advertising(service_name=new_name)
        # Setting the Avahi service name can fail if Avahi doesn't like the new name.
        # Persist only after it succeeds, so we don't persist something invalid.
        persisted_pretty_hostname = await persist_pretty_hostname(new_name)
        return persisted_pretty_hostname

    def get_name(self) -> str:
        return get_pretty_hostname()

    async def _on_avahi_collision(self) -> None:
        current_name = self.get_name()

        # Assume that the service name was the thing that collided.
        # Theoretically it also could have been the static hostname,
        # but our static hostnames are unique in practice, so that's unlikely.
        alternative_name = await self._avahi_client.alternative_service_name(
            current_name
        )
        _log.info(
            f"Name collision detected by Avahi."
            f" Changing name from {current_name} to {alternative_name}."
        )

        # Setting the new name includes persisting it for the next boot.
        #
        # Persisting the new name is recommended in the mDNS spec
        # (https://datatracker.ietf.org/doc/html/rfc6762#section-9).
        # It prevents two machines with the same name from flipping
        # which one is #1 and which one is #2 every time they reboot.
        await self.set_name(new_name=alternative_name)


class FakeNameSynchronizer(NameSynchronizer):
    """A dummy implementation of NameSynchronizer to use in integration tests.

    update-server's integration tests run on systems where we don't have access to
    an Avahi daemon. So RealNameSynchronizer wouldn't work.
    """

    def __init__(self, name_override: str) -> None:
        self._name_override = name_override

    async def set_name(self, new_name: str) -> str:
        raise NotImplementedError(
            "Can't change the name when it's been overridden for testing."
        )

    def get_name(self) -> str:
        return self._name_override


@asynccontextmanager
async def build_name_synchronizer(
    name_override: Optional[str],
) -> AsyncGenerator[NameSynchronizer, None]:
    """Return a RealNameSynchronizer for production or FakeNameManager for testing."""
    if name_override is None:
        avahi_client = await AvahiClient.connect()
        async with RealNameSynchronizer.build(
            avahi_client=avahi_client
        ) as real_name_synchronizer:
            yield real_name_synchronizer
    else:
        yield FakeNameSynchronizer(name_override=name_override)
