"""Client for the Protocol Analysis service (``opentrons/pe``) using Auth0 M2M credentials.

Ported from the pe integration test client (``perf_tests/integration_env.py``, ``perf_tests/auth0_token.py``,
``tests/integration/conftest.py``). Config comes from ``tests/helpers/test.env``:

    INTEGRATION_<TARGET>_API_URL
    INTEGRATION_<TARGET>_AUTH0_DOMAIN
    INTEGRATION_<TARGET>_AUTH0_AUDIENCE
    INTEGRATION_<TARGET>_M2M_CLIENT_ID
    INTEGRATION_<TARGET>_M2M_CLIENT_SECRET

Flow: ``POST /protocols/upload`` -> poll ``/protocols/{job_id}/status/poll`` -> ``GET /protocols/{job_id}/analysis``.
The service analyzes Flex protocols with the monorepo analyzer and OT-2 protocols with the opentrons-ot2 fork.
"""

import os
import threading
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Literal

import httpx
import jwt
from dotenv import load_dotenv

ENV_PATH = Path(__file__).parent / "test.env"
TOKEN_EXPIRY_SKEW_SECONDS = 60
POLL_TIMEOUT_SECONDS = 180.0
POLL_INTERVAL_SECONDS = 1.0

AnalysisTarget = Literal["local", "dev", "prod"]


@dataclass(frozen=True)
class AnalysisConfig:
    target: AnalysisTarget
    api_base_url: str
    auth0_domain: str
    auth0_audience: str
    m2m_client_id: str
    m2m_client_secret: str

    @property
    def cached_token_path(self) -> Path:
        return Path(__file__).parent / f"integration_{self.target}_cached_token.txt"


def get_analysis_config(target: AnalysisTarget = "dev") -> AnalysisConfig:
    load_dotenv(ENV_PATH)
    values: dict[str, str] = {}
    missing: list[str] = []
    for suffix in ["API_URL", "AUTH0_DOMAIN", "AUTH0_AUDIENCE", "M2M_CLIENT_ID", "M2M_CLIENT_SECRET"]:
        key = f"INTEGRATION_{target.upper()}_{suffix}"
        value = os.environ.get(key, "").strip()
        if not value:
            missing.append(key)
        values[suffix] = value
    if missing:
        raise EnvironmentError(f"Set in {ENV_PATH}: {', '.join(missing)}")
    return AnalysisConfig(
        target=target,
        api_base_url=values["API_URL"].rstrip("/"),
        auth0_domain=values["AUTH0_DOMAIN"],
        auth0_audience=values["AUTH0_AUDIENCE"],
        m2m_client_id=values["M2M_CLIENT_ID"],
        m2m_client_secret=values["M2M_CLIENT_SECRET"],
    )


def _token_is_fresh(token: str) -> bool:
    try:
        claims = jwt.decode(token, options={"verify_signature": False})
    except jwt.PyJWTError:
        return False
    return float(claims.get("exp", 0)) - TOKEN_EXPIRY_SKEW_SECONDS > time.time()


class M2MToken:
    """Auth0 client-credentials token, cached on disk until it nears expiry."""

    def __init__(self, config: AnalysisConfig) -> None:
        self.config = config
        self._lock = threading.Lock()
        self._value: str | None = None

    def get(self) -> str:
        with self._lock:
            if self._value and _token_is_fresh(self._value):
                return self._value
            path = self.config.cached_token_path
            if path.exists():
                cached = path.read_text().strip()
                if _token_is_fresh(cached):
                    self._value = cached
                    return cached
            self._value = self._fetch()
            path.write_text(self._value)
            return self._value

    def _fetch(self) -> str:
        response = httpx.post(
            f"https://{self.config.auth0_domain}/oauth/token",
            json={
                "client_id": self.config.m2m_client_id,
                "client_secret": self.config.m2m_client_secret,
                "audience": self.config.auth0_audience,
                "grant_type": "client_credentials",
            },
            timeout=30.0,
        )
        response.raise_for_status()
        token = response.json().get("access_token")
        if not isinstance(token, str) or not token:
            raise RuntimeError("Auth0 token response missing access_token")
        return token


@dataclass
class AnalysisOutcome:
    job_id: str | None
    status: Literal["complete", "failed", "timeout", "error"]
    result: str | None = None
    analyzer: str | None = None
    errors: list[dict[str, Any]] = field(default_factory=list)
    analysis: dict[str, Any] | None = None
    error: str | None = None

    @property
    def ok(self) -> bool:
        return self.status == "complete" and self.result == "ok"


class AnalysisClient:
    def __init__(self, config: AnalysisConfig) -> None:
        self.config = config
        self.token = M2MToken(config)
        self.httpx = httpx.Client(base_url=config.api_base_url, timeout=60.0)

    def close(self) -> None:
        self.httpx.close()

    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.token.get()}"}

    def health(self) -> dict[str, Any]:
        response = self.httpx.get("/health", headers=self._headers())
        response.raise_for_status()
        return dict(response.json())

    def upload(self, protocol_path: Path) -> str:
        files = [("files", (protocol_path.name, protocol_path.read_bytes(), "text/x-python"))]
        response = self.httpx.post("/protocols/upload", files=files, headers=self._headers())
        response.raise_for_status()
        return str(response.json()["job_id"])

    def poll(self, job_id: str, timeout: float = POLL_TIMEOUT_SECONDS) -> dict[str, Any]:
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            response = self.httpx.get(f"/protocols/{job_id}/status/poll", headers=self._headers())
            response.raise_for_status()
            payload: dict[str, Any] = response.json()
            if payload["status"] in ("complete", "failed"):
                return payload
            time.sleep(POLL_INTERVAL_SECONDS)
        raise TimeoutError(f"job {job_id} did not finish within {timeout}s")

    def get_analysis(self, job_id: str) -> dict[str, Any]:
        response = self.httpx.get(f"/protocols/{job_id}/analysis", headers=self._headers())
        response.raise_for_status()
        return dict(response.json())

    def analyze(self, protocol_path: Path) -> AnalysisOutcome:
        job_id: str | None = None
        try:
            job_id = self.upload(protocol_path)
            poll = self.poll(job_id)
            analyzer = (poll.get("revision") or {}).get("analyzer_software_id")
            if poll["status"] == "failed":
                return AnalysisOutcome(job_id=job_id, status="failed", analyzer=analyzer, error=str(poll.get("error")))
            body = self.get_analysis(job_id)
            analysis: dict[str, Any] = body["opentrons_analysis"]
            return AnalysisOutcome(
                job_id=job_id,
                status="complete",
                result=str(body["result"]),
                analyzer=analyzer,
                errors=list(analysis.get("errors", [])),
                analysis=analysis,
            )
        except TimeoutError as err:
            return AnalysisOutcome(job_id=job_id, status="timeout", error=str(err))
        except httpx.HTTPError as err:
            return AnalysisOutcome(job_id=job_id, status="error", error=repr(err))
