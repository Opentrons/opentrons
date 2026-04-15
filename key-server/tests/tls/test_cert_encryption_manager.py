"""Tests for the certificate encryption manager."""

from datetime import datetime, timedelta, timezone

import pytest

from key_server.tls.cert_encryption_manager import CertEncryptionManager


@pytest.fixture
def password_size() -> int:
    """The number of words for a password."""
    return 3


@pytest.fixture
def password_timestep_s() -> int:
    """How long the password validity duration quanta are."""
    return 30


@pytest.fixture
def t0() -> datetime:
    """The epoch time for password validity durations."""
    return datetime.now(timezone.utc)


@pytest.fixture
async def subject(
    password_size: int,
    password_timestep_s: int,
    t0: datetime,
) -> CertEncryptionManager:
    """A CertEncryptionManager set up with a keygen task."""
    return await CertEncryptionManager.create(password_size, password_timestep_s, t0)


async def test_current_pass_refreshes(
    subject: CertEncryptionManager, t0: datetime, password_timestep_s: int
) -> None:
    """It should give you a new password after the password duration quantum ticks."""
    first_pass = await subject.current_pass(
        t0 + timedelta(seconds=password_timestep_s // 2)
    )
    second_pass = await subject.current_pass(
        t0 + timedelta(seconds=(password_timestep_s * 3) // 2)
    )
    assert first_pass.key.urlencoded_key != second_pass.key.urlencoded_key


async def test_pass_lifecycle_no_initial_keys(subject: CertEncryptionManager) -> None:
    """It should not start with a key."""
    assert subject._current_key is None
    assert subject._previous_key is None


async def test_pass_lifecycle_has_initial_task(
    subject: CertEncryptionManager, t0: datetime, password_timestep_s: int
) -> None:
    """It should start with a task."""
    assert subject._keygen_task is not None


async def test_pass_lifecycle_first_key_use_marks(
    subject: CertEncryptionManager, t0: datetime, password_timestep_s: int
) -> None:
    """When a key is first requested it should be realized and marked with the current time."""
    first_key = await subject.current_pass(
        t0 + timedelta(seconds=(password_timestep_s // 2))
    )
    assert first_key.first_used_at_discretized == t0


async def test_pass_lifecycle_first_key_reused_within_window(
    subject: CertEncryptionManager, t0: datetime, password_timestep_s: int
) -> None:
    """When a key is requested multiple times in a window it should be reused."""
    first_key = await subject.current_pass(
        t0 + timedelta(seconds=(password_timestep_s * 0.5))
    )
    second_key = await subject.current_pass(
        t0 + timedelta(seconds=password_timestep_s * 0.6)
    )
    assert first_key == second_key


async def test_pass_lifecycle_key_not_reused_across_window(
    subject: CertEncryptionManager, t0: datetime, password_timestep_s: int
) -> None:
    """When a key is requested in a window after another key was in the previous window, the new key should be new."""
    first_key = await subject.current_pass(
        t0 + timedelta(seconds=(password_timestep_s * 0.5))
    )
    second_key = await subject.current_pass(
        t0 + timedelta(seconds=password_timestep_s * 1.5)
    )
    assert second_key != first_key


async def test_pass_lifecycle_first_key_becomes_previous(
    subject: CertEncryptionManager, t0: datetime, password_timestep_s: int
) -> None:
    """If keys are requested in subsequent windows the old one should be tracked."""
    first_key = await subject.current_pass(
        t0 + timedelta(seconds=password_timestep_s * 10.1)
    )
    first_as_prev = await subject.previous_pass(
        t0 + timedelta(seconds=password_timestep_s * 11.1)
    )
    assert first_as_prev == first_key


async def test_pass_lifecycle_does_not_keep_too_previous_keys(
    subject: CertEncryptionManager, t0: datetime, password_timestep_s: int
) -> None:
    """If keys are requested in non-subsequent windows the old one should not be tracked."""
    await subject.current_pass(t0 + timedelta(seconds=password_timestep_s * 10.1))
    none_prev = await subject.previous_pass(
        t0 + timedelta(seconds=password_timestep_s * 12.1)
    )
    assert none_prev is None


@pytest.mark.parametrize("quanta", [0.5, 10])
async def test_pass_lifecycle_has_no_previous_keys_initially(
    subject: CertEncryptionManager,
    t0: datetime,
    password_timestep_s: int,
    quanta: float,
) -> None:
    """When the initial key is requested there should be no previous key."""
    assert (
        await subject.previous_pass(
            t0 + timedelta(seconds=password_timestep_s * quanta)
        )
        is None
    )


@pytest.mark.parametrize(
    "quantum_multiple,quanta",
    [(0, 0), (1, 1), (0.75, 0), (1.25, 1), (10, 10), (20.2, 20)],
)
def test_discretize_now(
    password_timestep_s: int,
    subject: CertEncryptionManager,
    t0: datetime,
    quantum_multiple: float,
    quanta: int,
) -> None:
    """It should discretize times into chunks."""
    assert subject._discretize_now(
        t0 + timedelta(seconds=password_timestep_s * quantum_multiple)
    ) == (t0 + timedelta(seconds=password_timestep_s * quanta))
