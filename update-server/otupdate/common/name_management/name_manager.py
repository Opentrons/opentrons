from __future__ import annotations

from contextlib import asynccontextmanager
from logging import getLogger
from typing import AsyncGenerator

from aiohttp import web

from otupdate.common.constants import APP_VARIABLE_PREFIX
from .avahi import AvahiClient
from .pretty_hostname import get_pretty_hostname, persist_pretty_hostname


_NAME_MANAGER_VARNAME = APP_VARIABLE_PREFIX + "name_manager"
_log = getLogger(__name__)


class NameManager:
    def __init__(self, avahi_client: AvahiClient) -> None:
        """For internal use by this class only."""
        self._avahi_client = avahi_client

    @classmethod
    @asynccontextmanager
    async def build(
        cls, avahi_client: AvahiClient
    ) -> AsyncGenerator[NameManager, None]:
        name_manager = NameManager(avahi_client)
        async with avahi_client.collision_callback(name_manager._on_avahi_collision):
            await avahi_client.start_advertising(service_name=name_manager.get_name())
            yield name_manager

    @classmethod
    def from_request(cls, request: web.Request) -> NameManager:
        return cls.from_app(request.app)

    @staticmethod
    def from_app(app: web.Application) -> NameManager:
        name_manager = app.get(_NAME_MANAGER_VARNAME, None)
        assert isinstance(
            name_manager, NameManager
        ), f"Unexpected type {type(name_manager)}. Incorrect Application setup?"
        return name_manager

    async def set_name(self, new_name: str) -> str:
        """See `set_name_endpoint()`."""
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

        # TODO: Is this some kind of race condition?
        alternative_name = await self._avahi_client.alternative_service_name(
            current_name
        )
        _log.info(
            f"Name collision detected by Avahi. Changing name to {alternative_name}."
        )
        await self.set_name(new_name=alternative_name)


@asynccontextmanager
async def build_and_insert(app: web.Application) -> AsyncGenerator[None, None]:
    avahi_client = await AvahiClient.connect()
    async with NameManager.build(avahi_client=avahi_client) as name_manager:
        app[_NAME_MANAGER_VARNAME] = name_manager
        yield
