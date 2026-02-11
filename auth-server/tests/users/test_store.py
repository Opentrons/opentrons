import pytest

from auth_server.users.store import hash_password, password_hash


@pytest.mark.parametrize("plain", ["securepassword123", "securepassword1234"])
def test_hash_password_returns_hashed_string(plain: str) -> None:
    """hash_password should return a string that is not the plaintext password."""
    hashed = hash_password(plain)
    assert isinstance(hashed, str)
    assert hashed != plain


@pytest.mark.parametrize("plain", ["securepassword123", "securepassword1234"])
def test_hash_password_is_verifiable(plain: str) -> None:
    """The hashed password should be verifiable against the original plaintext."""
    hashed = hash_password(plain)
    assert password_hash.verify(plain, hashed) is True


@pytest.mark.parametrize("plain", ["securepassword123", "securepassword1234"])
def test_hash_password_rejects_wrong_password(plain: str) -> None:
    """Verification should fail for a different plaintext password."""
    hashed = hash_password(plain)
    assert password_hash.verify("wrong_password", hashed) is False


@pytest.mark.parametrize("plain", ["securepassword123", "securepassword1234"])
def test_hash_password_produces_unique_hashes(plain: str) -> None:
    """Hashing the same password twice should produce different hashes (due to salting)."""
    hash1 = hash_password(plain)
    hash2 = hash_password(plain)
    assert hash1 != hash2
    # Both should still verify against the original password.
    assert password_hash.verify(plain, hash1) is True
    assert password_hash.verify(plain, hash2) is True
