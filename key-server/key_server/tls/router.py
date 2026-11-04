from textwrap import dedent
from typing import Annotated

import fastapi

from server_utils.fastapi_utils.models.json_api import (
    PydanticResponse,
    SimpleBody,
)

from .dependency import get_tls_manager
from .manager import TLSManager
from .models import CertPassword, EncryptedCACertificates, PlaintextCACertificates

router = fastapi.APIRouter()


@PydanticResponse.wrap_route(
    router.get,
    path="/keys/external/ca/encryptedCerts",
    summary="Get the current and next CA certificates in encrypted form.",
    description=dedent(
        """\
        Get the CA certificates the Flex uses to sign the end entity certificates for TLS termination, encrypted.

        This is the endpoint to use to set up a secure connection to a previously-unknown robot. It presents the
        certificates encrypted with a password that is only available to a human interacting with the Flex touchscreen.

        The returned certificates are encrypted with the Fernet symmetric cryptosystem (https://github.com/fernet/spec/)
        using a key derived from a password displayed on the Flex touchscreen.

        The CA certificate currently used to sign the Flex end entity certificates is always presented. If the current
        CA certificate will expire soon, there is also a "next" CA certificate presented; Flex will start using the next
        CA when the current CA will soon expire (not exactly when it expires, to prevent downtime). The next CA certificate
        therefore may or may not be present, and this may change over time. You should poll the unencrypted version of this
        endpoint (/keys/external/ca/plaintextCerts) via HTTPS every month or so to make sure you get the next CA often enough
        that the TLS channel is maintained.

        The Fernet encryption for the certificates uses a key derived with PBKDF2HMAC SHA256. The KDF details (salt and rounds)
        are sent alongside the encrypted certificate; the password is visible from the Flex touchscreen. The passwords displayed
        on the touchscreen rotate every so often, similar to TOTPs; therefore each certificate is usually presented encrypted
        with both the current and the previous passwords, in case the user enters the password immediately before it rotates.
        The passwords are only generated when needed, which here means when the user is looking at the touchscreen; there may
        not always be a previous password, and in that case there won't be a previous-password-encrypted certificate presented.

        All bytestring data (the encrypted cert payloads and the salt) are presented base64 encoded with the url-safe alphabet;
        you will need to decode the salt, but many Fernet libraries automatically handle base64 decoding or indeed require the
        input to be base64 encoded.

        The flow for using this endpoint is:
        1. Wait for the user to enter the password from the Flex. Fetching this endpoint ahead of time may mean the certificates
           are not encrypted with the password the user enters, since future passwords are not predictable.
        2. Fetch this endpoint
        3. Generate key material from the user's password; use PBKDF2HMAC with SHA256 as the hasher, using the salt and rounds
           from this endpoint's response. You will need to base64 decode the salt first.
        4. Attempt to decrypt the current CA certificate encrypted with the current key; if decryption succeeded, this will be a
           DER-encoded x509 self-signed certificate that is a CA.
        5. If that didn't succeed, try the current CA certificate encrypted with the previous key. If this also doesn't succeed,
           the user entered the password wrong.
        6. Do the same thing for the next CA, if it exists
        7. Add both the current and next (if it exists) CAs to your trust store. Add these only for robot communications; do not
           use them for Internet communications.
        """
    ),
)
async def get_encrypted_certs(
    tls_manager: Annotated[TLSManager, fastapi.Depends(get_tls_manager)],
) -> PydanticResponse[SimpleBody[EncryptedCACertificates]]:
    """Get encrypted CA certificates."""
    current_ca = await tls_manager.get_current_ca_cert_encrypted()
    next_ca = await tls_manager.get_next_ca_cert_encrypted()
    return await PydanticResponse.create(
        status_code=fastapi.status.HTTP_200_OK,
        content=SimpleBody(
            data=EncryptedCACertificates(current=current_ca, next=next_ca)
        ),
    )


@PydanticResponse.wrap_route(
    router.get,
    path="/keys/external/ca/plaintextCerts",
    summary="Get the current and next CA certificates unencrypted.",
    description=dedent(
        """\
        Get the CA certificates the Flex uses to sign the end entity certificates for TLS termination, in plaintext.

        This is the endpoint to use to maintain a TLS connection through CA certificate rotation. It should only be
        accessed via HTTPS to avoid attacker-in-the-middle concerns. The CA certificates are presented in the clear.
        To set up secure communication with a robot for the first time using only HTTP, use the encrypted version of this
        endpoint (/keys/external/ca/encryptedCerts).

        The CA certificate currently used to sign the Flex end entity certificates is always presented. If the current
        CA certificate will expire soon, there is also a "next" CA certificate presented; Flex will start using the next
        CA when the current CA will soon expire (not exactly when it expires, to prevent downtime). The next CA certificate
        therefore may or may not be present, and this may change over time. You should poll this endpoint via HTTPS every
        month or so to make sure you get the next CA often enough that the TLS channel is maintained.

        The certificate bytestrings are base64 encoded with the urlsafe alphabet and when decoded are DER-encrypted x509
        certificates.
        """
    ),
)
async def get_plaintext_certs(
    tls_manager: Annotated[TLSManager, fastapi.Depends(get_tls_manager)],
) -> PydanticResponse[SimpleBody[PlaintextCACertificates]]:
    """Get unencrypted CA certificates."""
    current_ca = await tls_manager.get_current_ca_cert_der()
    next_ca = await tls_manager.get_next_ca_cert_der()
    return await PydanticResponse.create(
        status_code=fastapi.status.HTTP_200_OK,
        content=SimpleBody(
            data=PlaintextCACertificates(current=current_ca, next=next_ca)
        ),
    )


@PydanticResponse.wrap_route(
    router.get, path="/keys/internal/ca/password", include_in_schema=False
)
async def get_password(
    tls_manager: Annotated[TLSManager, fastapi.Depends(get_tls_manager)],
) -> PydanticResponse[SimpleBody[CertPassword]]:
    """Get the current password. Internal."""
    password = await tls_manager.get_current_cert_password()
    return await PydanticResponse.create(
        status_code=fastapi.status.HTTP_200_OK, content=SimpleBody(data=password)
    )
