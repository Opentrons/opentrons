"""Shared execution helpers for demo-user access-control tests."""

from __future__ import annotations

import asyncio

import httpx

from automation.auth_access import assert_allowed, assert_forbidden, authorized_request
from automation.clients.auth import AuthClient
from automation.clients.auth_models import TokenResponse
from automation.demo_access_matrix import HttpAccessCase, LoginScopeCase


def _case_needs_serial_execution(case: HttpAccessCase) -> bool:
    """Update-session probes mutate shared robot state and must not run in parallel."""

    return case.reset_update_session_before or case.cancel_update_session_after


async def run_http_access_case(
    client: AuthClient,
    token: TokenResponse,
    case: HttpAccessCase,
) -> httpx.Response:
    """Execute one matrix HTTP case and assert the expected auth outcome."""

    if case.reset_update_session_before:
        await client._client.post(
            "/server/update/cancel",
            headers=AuthClient.auth_header(token),
        )

    response = await authorized_request(client, case.to_probe(), token)

    if case.expectation == "allow":
        assert_allowed(response, case.to_probe())
        if case.allowed_must_be_200:
            assert response.status_code == 200, (
                f"{case.label}: expected HTTP 200, got {response.status_code} for {case.method} {case.path}"
            )
    else:
        assert_forbidden(response, case.to_probe())

    if case.cancel_update_session_after and response.status_code == 201:
        await client._client.post(
            "/server/update/cancel",
            headers=AuthClient.auth_header(token),
        )

    return response


async def run_http_access_cases_concurrently(
    client: AuthClient,
    tokens_by_role: dict[str, TokenResponse],
    cases: tuple[HttpAccessCase, ...],
) -> None:
    """Run HTTP probes concurrently; update-session probes run serially afterward."""

    parallel_cases = tuple(case for case in cases if not _case_needs_serial_execution(case))
    serial_cases = tuple(case for case in cases if _case_needs_serial_execution(case))

    if parallel_cases:
        await _gather_cases(client, tokens_by_role, parallel_cases)

    for case in serial_cases:
        await run_http_access_case(client, tokens_by_role[case.demo_user], case)


async def _gather_cases(
    client: AuthClient,
    tokens_by_role: dict[str, TokenResponse],
    cases: tuple[HttpAccessCase, ...],
) -> None:
    results = await asyncio.gather(
        *(run_http_access_case(client, tokens_by_role[case.demo_user], case) for case in cases),
        return_exceptions=True,
    )
    failures = [
        (cases[index].label, result) for index, result in enumerate(results) if isinstance(result, BaseException)
    ]
    if failures:
        lines = "\n".join(f"  - {label}: {err!r}" for label, err in failures)
        raise AssertionError(f"{len(failures)} concurrent HTTP probe(s) failed:\n{lines}")


async def run_login_scope_case(
    client: AuthClient,
    *,
    username: str,
    password: str,
    case: LoginScopeCase,
) -> httpx.Response:
    """Execute one matrix login scope case."""

    response = await client.get_token_raw(
        grant_type="password",
        client_id=client.client_id,
        username=username,
        password=password,
        scope=case.requested_scope,
    )

    if case.expectation == "forbid":
        assert response.status_code == 400, (
            f"{case.description}: expected HTTP 400, got {response.status_code}: {response.text[:300]!r}"
        )
        body = response.json()
        assert body.get("error") == "invalid_scope", body
    else:
        assert response.status_code == 200, (
            f"{case.description}: expected HTTP 200, got {response.status_code}: {response.text[:300]!r}"
        )
        body = response.json()
        assert body.get("scope") == case.expected_granted_scope, body

    return response


async def run_login_scope_cases_concurrently(
    client: AuthClient,
    *,
    usernames_by_role: dict[str, str],
    password: str,
    cases: tuple[LoginScopeCase, ...],
) -> None:
    """Run independent ROPC scope negotiation probes concurrently."""

    results = await asyncio.gather(
        *(
            run_login_scope_case(
                client,
                username=usernames_by_role[case.demo_user],
                password=password,
                case=case,
            )
            for case in cases
        ),
        return_exceptions=True,
    )
    failures = [
        (cases[index].description, result) for index, result in enumerate(results) if isinstance(result, BaseException)
    ]
    if failures:
        lines = "\n".join(f"  - {label}: {err!r}" for label, err in failures)
        raise AssertionError(f"{len(failures)} concurrent login probe(s) failed:\n{lines}")
