from typing import Any

import httpx
from aws_lambda_powertools import Logger

from api.settings import Settings

settings: Settings = Settings()
logger: Logger = Logger(service=settings.service_name)


class HTTPClient:
    def __init__(
        self,
        base_url: str,
        timeout: float = 10.0,
        connect_timeout: float = 5.0,
    ) -> None:
        """
        Initializes the HTTP client with custom timeout and retry configurations.

        :param base_url: Base URL for all requests.
        :param timeout: Total timeout for each request.
        :param connect_timeout: Timeout for establishing a connection.
        """
        self.base_url = base_url
        self.timeout = httpx.Timeout(timeout, connect=connect_timeout)
        self.client = httpx.Client(base_url=self.base_url, timeout=self.timeout)

    def sync_request(self, method: str, endpoint: str, **kwargs: Any) -> httpx.Response:
        """
        Synchronous HTTP request.

        :param method: HTTP method as a string ('GET', 'POST', etc.)
        :param endpoint: Endpoint URL (to be concatenated with base_url)
        :param kwargs: Additional arguments to pass to httpx request (like json, headers)
        :return: httpx.Response object or error message as a string
        """
        try:
            url = f"{self.base_url}{endpoint}"
            response = self.client.request(method, url, **kwargs)
            return response
        except httpx.RequestError as e:
            logger.error(f"An error occurred while requesting {e.request.url!r}.")
            logger.exception(e)
        except httpx.HTTPStatusError as e:
            logger.error(f"Non-success status code received: {e.response.status_code} for URL: {e.request.url!r}")
            logger.exception(e)
        finally:
            self.client.close()
        return response

    async def async_request(self, method: str, endpoint: str, **kwargs: Any) -> httpx.Response:
        """
        Asynchronous HTTP request.

        :param method: HTTP method as a string ('GET', 'POST', etc.)
        :param endpoint: Endpoint URL (to be concatenated with base_url)
        :param kwargs: Additional arguments to pass to httpx request (like json, headers)
        :return: Coroutine that yields an httpx.Response object or error message as a string
        """
        async with httpx.AsyncClient(base_url=self.base_url, timeout=self.timeout) as client:
            try:
                response = await client.request(method, endpoint, **kwargs)
                return response
            except httpx.RequestError as e:
                logger.error(f"An error occurred while requesting {e.request.url!r}.")
                logger.exception(e)
            except httpx.HTTPStatusError as e:
                logger.error(f"Non-success status code received: {e.response.status_code} for URL: {e.request.url!r}")
                logger.exception(e)
            finally:
                self.client.close()
            return response

    def close(self) -> None:
        """
        Close the HTTP client to free up resources.
        """
        self.client.close()
