"""Bindings to key-server's HTTP API.

This is just the bare minimum required by dependent servers to sign log messages
against key-server's signing key. Only the ``signMessage`` endpoint is exposed;
the public-key endpoint and any other future endpoints are intentionally not
proxied through this client.
"""

from __future__ import annotations

import contextlib
import logging
import typing
from abc import ABC, abstractmethod

import aiohttp
import pydantic
from requests import session

SIGN_MESSAGE_ENDPOINT_PATH = "keys/internal/logSigning/signMessage"
PUBLIC_KEY_ENDPOINT_PATH = "/keys/external/logSigning/publicKey"

_log = logging.getLogger(__name__)


class Client(ABC):
    """An interface for a dependent server to sign log messages via key-server."""

    @abstractmethod
    async def sign_message(self, message: SignMessageData) -> SignedMessageData:
        """Sign a single log message.

        If the key-server cannot be contacted, or it returns a non-2xx response,
        the implementation must raise an exception. Callers should never see a
        silently-discarded signing request.
        """
        pass

    @abstractmethod
    async def get_key_and_hash(self) -> PublicKeyAndHash:
        """Get the public key and hash of the public signing certificate."""
        pass


class LocalHTTPClient(Client):
    """A client implementation that talks to key-server over a local HTTP connection."""

    def __init__(
        self,
        *,
        key_server_uds: str | None = None,
        key_server_url: str | None = None,
    ) -> None:
        """Construct the client.

        Params:
            key_server_uds: e.g. `/path/to/socket`, to connect to key-server via
                a Unix domain socket.
            key_server_url: e.g. `http://localhost:1234`, to connect to key-server
                via TCP.
        """
        if key_server_uds is not None and key_server_url is not None:
            raise ValueError("Specify only one of key_server_uds or key_server_url.")

        if key_server_uds is not None:
            connector = aiohttp.UnixConnector(path=key_server_uds)
            session = aiohttp.ClientSession(
                connector=connector,
                # We're connecting over a Unix socket, so this URL is nonsensical,
                # but aiohttp seems to require it as a placeholder.
                # https://github.com/aio-libs/aiohttp/issues/11324.
                base_url="http://localhost",
            )
        elif key_server_url is not None:
            session = aiohttp.ClientSession(base_url=key_server_url)
        else:
            raise ValueError("Specify key_server_uds or key_server_url.")

        self._session = session
        self._exit_stack = contextlib.AsyncExitStack()

    async def __aenter__(self) -> typing.Self:
        """When entered as a context manager, open the underlying connection."""
        await self._exit_stack.enter_async_context(self._session)
        return self

    async def __aexit__(
        self, exc_type: object, exc_value: object, traceback: object
    ) -> None:
        """When exited as a context manager, close the underlying connection."""
        await self._exit_stack.aclose()

    @typing.override
    async def sign_message(self, message: SignMessageData) -> SignedMessageData:
        request_body = SignMessageRequestBody(data=message)
        async with self._session.post(
            SIGN_MESSAGE_ENDPOINT_PATH,
            data=request_body.model_dump_json(),
            headers={"Content-Type": "application/json"},
        ) as response:
            response_bytes = await response.read()
        response.raise_for_status()
        parsed_response = SignMessageResponseBody.model_validate_json(response_bytes)
        return parsed_response.data

    @typing.override
    async def get_key_and_hash(self) -> PublicKeyAndHash:
        async with self._session.get(PUBLIC_KEY_ENDPOINT_PATH) as response:
            response_json = await response.json()
        response.raise_for_status()
        return PublicKeyAndHash(
            publicKey=response_json["data"]["publicKeyPem"],
            publicHash=response_json["data"]["hashedKey"],
        )


class _StrictBaseModel(pydantic.BaseModel):
    model_config = {"strict": True}


class SignMessageData(_StrictBaseModel):
    """The payload portion of a sign-message request."""

    message: str
    previousHash: str | None


class SignedMessageData(_StrictBaseModel):
    """The payload portion of a sign-message success response."""

    message: str
    messageHash: str
    messageSignature: str
    signatureVersion: int


class SignMessageRequestBody(_StrictBaseModel):
    """Request envelope for sign-message."""

    data: SignMessageData


class SignMessageResponseBody(_StrictBaseModel):
    """Response envelope for sign-message."""

    data: SignedMessageData


class PublicKeyAndHash(_StrictBaseModel):
    """The robot's log signing public key and the hash of the public signing cert."""

    publicKey: str
    publicHash: str
