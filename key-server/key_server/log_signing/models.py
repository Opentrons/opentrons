from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, Field


class SignableMessage(BaseModel):
    """An unsigned message that is ready to be signed."""

    message: Annotated[
        str,
        Field(
            ...,
            description="The message to sign. This should be representable in UTF-8 (it will be hashed in that encoding).",
        ),
    ]
    previousHash: Annotated[
        str | None,
        Field(
            ...,
            description=(
                "The hash of the message immediately preceding this one. If no message immediately preceded this one, this may be None. "
                'If it is not None, it must be of the form "hashAlg:b64Hash", where hashAlg is the hash algorithm (only sha256 is allowed) '
                "and b64Hash is the url-safe base64 encoding of the binary hash data."
            ),
        ),
    ]


class SignedMessage(BaseModel):
    """A message that has been signed by the robot's signing key."""

    message: Annotated[str, Field(..., description="The message that has been signed.")]
    messageHash: Annotated[
        str,
        Field(
            ...,
            description=(
                "The hash of the concatenation of hash(message) + previousHash. This value is in the format "
                '"hashAlg:b64hash" where hashAlg is sha256 and b64hash is the url-safe base64 encoding of the binary hash data.'
            ),
        ),
    ]
    messageSignature: Annotated[
        str,
        Field(
            ...,
            description=(
                'The signature of the messageHash. This value is in the form "sigAlg:b64sig" where sigAlg identifies the signature '
                "method, here ed25519, and b64sig is the url-safe base64 encoding of the Ed25519 signature of the hash field."
            ),
        ),
    ]
    signatureVersion: Annotated[
        Literal[1],
        Field(
            default=1,
            description=(
                "The version of the signing algorithm used. In version 1, the signature is an Ed25519 signature over (messageHash + previousHash) "
                "where + indicates concatenation, messageHash is the SHA-256 hash of the provided message encoded as UTF-8 with no replacements "
                "(signing fails if a message character cannot be represented in UTF-8), previousHash is the SHA-256 hash of the previous message "
                "as provided by the request, and if previousHash is None the empty byte string is used instead. Signatures of empty messages are allowed."
            ),
        ),
    ]


class SigningPublicKey(BaseModel):
    """The public key used for signing messages."""

    publicKeyPem: Annotated[
        str,
        Field(..., description="The public key in PEM SubjectPublicKeyInfo format."),
    ]
