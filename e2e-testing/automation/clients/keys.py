"""HTTP client for Flex key-server TLS certificate endpoints (HTTPS on a real robot)."""

from __future__ import annotations

from types import TracebackType

import httpx

from automation.clients.keys_models import (
    EncryptedCACertificatesData,
    EncryptedCACertificatesEnvelope,
)
from automation.robot_certs.host import RobotHost, resolve_robot_host
from automation.robot_certs.registry import DEFAULT_HTTP_PORT, DEFAULT_HTTPS_PORT
from automation.robot_encryption import ROBOT_API_VERSION, ROBOT_API_VERSION_HEADER

__all__ = [
    "DEFAULT_HTTP_PORT",
    "DEFAULT_HTTPS_PORT",
    "KeysClient",
    "fetch_encrypted_ca_certificates_http",
]


class KeysClient:
    """Async client for ``/keys/external/ca/*`` on a Flex robot over HTTPS."""

    def __init__(
        self,
        robot_ip: str,
        *,
        timeout: float = 30.0,
    ) -> None:
        self.robot_host: RobotHost = resolve_robot_host(robot_ip)
        self._client = httpx.AsyncClient(
            base_url=self.robot_host.base_url,
            timeout=timeout,
            verify=self.robot_host.httpx_verify(),
            headers=self.robot_host.default_headers,
        )

    @property
    def base_url(self) -> str:
        return self.robot_host.base_url

    async def __aenter__(self) -> KeysClient:
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        await self.close()

    async def close(self) -> None:
        await self._client.aclose()

    async def get_encrypted_ca_certificates(self) -> EncryptedCACertificatesData:
        """GET /keys/external/ca/encryptedCerts (no auth required)."""
        response = await self._client.get("/keys/external/ca/encryptedCerts")
        response.raise_for_status()
        envelope = EncryptedCACertificatesEnvelope.model_validate(response.json())
        return envelope.data


async def fetch_encrypted_ca_certificates_http(
    robot_ip: str,
    *,
    http_port: int = DEFAULT_HTTP_PORT,
    timeout: float = 30.0,
) -> EncryptedCACertificatesData:
    """Fetch encrypted CA certs over HTTP before robot CA trust is installed.

    Used only by ``scripts/verify_robot_encryption.py`` during the one-time
    encryption-key flow. Normal client code should use :class:`KeysClient` over HTTPS.
    """
    base_url = f"http://{robot_ip}:{http_port}"
    headers = {ROBOT_API_VERSION_HEADER: ROBOT_API_VERSION}
    async with httpx.AsyncClient(base_url=base_url, timeout=timeout, headers=headers) as client:
        response = await client.get("/keys/external/ca/encryptedCerts")
        response.raise_for_status()
        envelope = EncryptedCACertificatesEnvelope.model_validate(response.json())
        return envelope.data
