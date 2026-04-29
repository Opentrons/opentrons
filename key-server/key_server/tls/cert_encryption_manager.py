"""Code for handling certificate encryption for export."""

import asyncio
import base64
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from logging import getLogger
from typing import Self, Type

from . import cryptography_utils
from .models import EncryptedCert, OldAndNewEncryptedCert

LOG = getLogger(__name__)


@dataclass
class UnusedEncryptionKey:
    """A key that has not yet been used."""

    key: cryptography_utils.FernetKey


@dataclass
class UsedEncryptionKey:
    """A key and when it was used."""

    key: cryptography_utils.FernetKey
    first_used_at_discretized: datetime


class CertEncryptionManager:
    """Class for handling key rotation and encryption for TLS cert export."""

    def __init__(
        self,
        keygen_task: "asyncio.Task[cryptography_utils.FernetKey]",
        password_size_words: int,
        password_timestep_s: int,
        t0: datetime,
    ) -> None:
        """Build a CertEncryptionManager.

        This should be used for testing only; prefer create().
        """
        self._keygen_task: "asyncio.Task[cryptography_utils.FernetKey] | None" = (
            keygen_task
        )
        self._current_key: UnusedEncryptionKey | UsedEncryptionKey | None = None
        self._previous_key: UsedEncryptionKey | None = None
        self._password_size_words = password_size_words
        self._password_timestep_s = password_timestep_s
        self._t0 = t0

    @classmethod
    async def create(
        cls: Type[Self],
        password_size_words: int,
        password_timestep_s: int,
        now: datetime | None = None,
    ) -> Self:
        """Create a cert encryption manager with an initial key generation task."""
        keygen_task = asyncio.create_task(
            cls._create_key(password_size_words), name="keygen"
        )
        return cls(
            keygen_task,
            password_size_words,
            password_timestep_s,
            now or datetime.now(timezone.utc),
        )

    @property
    def key_validity_time(self) -> timedelta:
        """Get the amount of time a key is valid."""
        return timedelta(seconds=self._password_timestep_s)

    @staticmethod
    async def _create_key(words: int) -> cryptography_utils.FernetKey:
        password = cryptography_utils.make_password(words)
        return await cryptography_utils.make_fernet_key(password)

    def _key_period_current(
        self, key: UnusedEncryptionKey | UsedEncryptionKey | None, now: datetime
    ) -> UsedEncryptionKey | None:
        """Is this key for the current discretization period?"""
        if not key:
            return None
        if isinstance(key, UnusedEncryptionKey):
            return None
        key_age_s = (now - key.first_used_at_discretized).total_seconds()
        if key_age_s <= self._password_timestep_s:
            return key
        else:
            return None

    def _key_period_previous(
        self, key: UsedEncryptionKey | UnusedEncryptionKey | None, now: datetime
    ) -> UsedEncryptionKey | None:
        """Is this key for the immediately preceding discretization period?"""
        if not key:
            return None
        if isinstance(key, UnusedEncryptionKey):
            return None
        key_age_s = (now - key.first_used_at_discretized).total_seconds()
        if (
            key_age_s > self._password_timestep_s
            and key_age_s <= self._password_timestep_s * 2
        ):
            return key
        else:
            return None

    async def _ensure_keys(self, now: datetime) -> None:
        if self._key_period_current(self._current_key, now) or isinstance(
            self._current_key, UnusedEncryptionKey
        ):
            # if our current key is still valid, we don't touch it (but we do make sure that
            # the previous key is still immediately-previous)
            if not self._key_period_previous(self._previous_key, now):
                self._previous_key = None
        elif (current := self._key_period_previous(self._current_key, now)) is not None:
            # if what we thought was our current key is now exactly previous, then the previous
            # key must now have aged out; make the current previous, losing the old previous
            self._previous_key = current
            self._current_key = None
        else:
            # the current key isn't current, and also it isn't previous, which means it's older than
            # previous... and since the previous key must be older, that isn't previous either
            self._current_key = None
            self._previous_key = None
        # if we don't have a new key cooking, start one
        if not self._keygen_task:
            self._keygen_task = asyncio.create_task(
                self._create_key(self._password_size_words), name="keygen"
            )

        # if we don't have a current key, get one
        if not self._current_key:
            self._current_key = UnusedEncryptionKey(await self._get_key())

    async def _get_key(self) -> cryptography_utils.FernetKey:
        if not self._keygen_task:
            LOG.info("CA cert encryption key background generation miss")
            self._keygen_task = asyncio.create_task(
                self._create_key(self._password_size_words), name="keygen"
            )
        try:
            return await self._keygen_task
        except BaseException:
            LOG.exception("CA cert encryption key generation failed")
            raise
        finally:
            self._keygen_task = asyncio.create_task(
                self._create_key(self._password_size_words), name="keygen"
            )

    def _discretize_now(self, now: datetime) -> datetime:
        assert now >= self._t0, "Time before t0 passed"
        difference = now - self._t0
        quotient = difference.total_seconds() // self._password_timestep_s
        return self._t0 + timedelta(seconds=quotient * self._password_timestep_s)

    async def current_pass(self, now: datetime) -> UsedEncryptionKey:
        """The current key, including generating it if not already present."""
        await self._ensure_keys(now)
        if not self._current_key:
            raise Exception("No encryption key for CA cert")
        elif isinstance(self._current_key, UnusedEncryptionKey):
            self._current_key = UsedEncryptionKey(
                key=self._current_key.key,
                first_used_at_discretized=self._discretize_now(now),
            )
            return self._current_key
        else:
            return self._current_key

    async def previous_pass(self, now: datetime) -> UsedEncryptionKey | None:
        """The last-used key."""
        await self._ensure_keys(now)
        return self._previous_key

    def _encrypt(self, encoded_cert: bytes, key: UsedEncryptionKey) -> EncryptedCert:
        return EncryptedCert(
            cert_data=cryptography_utils.encrypt_cert(encoded_cert, key.key),
            key_salt=base64.urlsafe_b64encode(key.key.salt),
            key_expires_at=key.first_used_at_discretized
            + timedelta(seconds=self._password_timestep_s),
            kdf_iterations=key.key.kdf_iterations,
        )

    async def encrypt_cert_der_bytes(
        self, now: datetime, encoded_cert: bytes
    ) -> OldAndNewEncryptedCert:
        """Encrypt some bytes (which should be a DER-encoded cert) using the current and previous keys."""
        current_key = await self.current_pass(now)
        previous_key = await self.previous_pass(now)
        current_encrypted = self._encrypt(encoded_cert, current_key)
        if isinstance(previous_key, UsedEncryptionKey):
            previous_encrypted: EncryptedCert | None = self._encrypt(
                encoded_cert, previous_key
            )
        else:
            previous_encrypted = None
        return OldAndNewEncryptedCert(
            current=current_encrypted, previous=previous_encrypted
        )

    async def encrypt_cert(
        self, now: datetime, cert: cryptography_utils.X509Pair
    ) -> OldAndNewEncryptedCert:
        """Encrypt a certificate using the current and previous (if existing) keys."""
        return await self.encrypt_cert_der_bytes(
            now, cryptography_utils.get_cert_bytes_der(cert.cert)
        )
