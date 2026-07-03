"""Useful constants for TLS management."""

import re
from typing import Final

from cryptography import x509

# these are the x509 cert details that are the same for all of our CA certs

# our CA style: no intermediate CAs (we rotate these pretty frequently, and wouldn't be storing them
# anywhere different)
CA_BASIC_CONSTRAINTS = x509.BasicConstraints(ca=True, path_length=0)
# standard ca KU
CA_KU = x509.KeyUsage(
    digital_signature=True,  # required for any signature
    content_commitment=False,
    key_encipherment=False,
    data_encipherment=False,
    key_agreement=False,
    key_cert_sign=True,
    crl_sign=True,  # we don't use CRLs, at least not yet, but browsers may choke without this
    encipher_only=False,
    decipher_only=False,
)
# our ca name field
CA_NAME = x509.Name(
    [
        x509.NameAttribute(x509.NameOID.COUNTRY_NAME, "US"),
        x509.NameAttribute(x509.NameOID.STATE_OR_PROVINCE_NAME, "New York"),
        x509.NameAttribute(x509.NameOID.LOCALITY_NAME, "New York"),
        x509.NameAttribute(x509.NameOID.ORGANIZATION_NAME, "Opentrons"),
        x509.NameAttribute(x509.NameOID.COMMON_NAME, "Opentrons Flex TLS CA"),
    ]
)

# the names of our CA keys and certs, both as a regex for parsing from directories and a format
# for saving
CA_CERT_NAME_PATTERN: Final = re.compile(r"^ot-robot-tls-ca-(\d{4}-\d{2}-\d{2})\.cer$")
CA_KEY_NAME_PATTERN: Final = re.compile(r"^ot-robot-tls-ca-(\d{4}-\d{2}-\d{2})\.pem$")

CA_CERT_NAME_FORMAT: Final = "ot-robot-tls-ca-{expiry}.cer"
CA_KEY_NAME_FORMAT: Final = "ot-robot-tls-ca-{expiry}.pem"

END_ENTITY_BASIC_CONSTRAINTS = x509.BasicConstraints(ca=False, path_length=None)

# our TLS certificate entity name (this would be displayed in a browser)
END_ENTITY_NAME = x509.Name(
    [
        x509.NameAttribute(x509.NameOID.COUNTRY_NAME, "US"),
        x509.NameAttribute(x509.NameOID.STATE_OR_PROVINCE_NAME, "New York"),
        x509.NameAttribute(x509.NameOID.LOCALITY_NAME, "New York"),
        x509.NameAttribute(x509.NameOID.ORGANIZATION_NAME, "Opentrons"),
        x509.NameAttribute(x509.NameOID.COMMON_NAME, "Opentrons Flex Robot"),
    ]
)

# standard TLS end entity key usage
END_ENTITY_KU = x509.KeyUsage(
    digital_signature=True,
    content_commitment=False,
    key_encipherment=True,
    data_encipherment=False,
    key_agreement=False,
    key_cert_sign=False,
    crl_sign=True,
    encipher_only=False,
    decipher_only=False,
)

# standard TLS EKU
END_ENTITY_EKU = x509.ExtendedKeyUsage(
    [
        x509.oid.ExtendedKeyUsageOID.CLIENT_AUTH,
        x509.oid.ExtendedKeyUsageOID.SERVER_AUTH,
    ]
)

TLS_KEY_NAME_PATTERN: Final = re.compile(r"^ot-robot-tls-key.pem$")
TLS_CERT_NAME_PATTERN: Final = re.compile(r"^ot-robot-tls-cert.crt$")
TLS_KEY_NAME: Final = "ot-robot-tls-key.pem"
TLS_CERT_NAME: Final = "ot-robot-tls-cert.crt"

# django's default work factor for PBKDF2HMAC/SHA256 is 1.2-1.5 million, for a real server (see the defaults
# in the PBKDF2PasswordHasher class here:
# https://github.com/django/django/blob/main/django/contrib/auth/hashers.py )
# That would take about 20 seconds per spin, for us, so unfortunately we use a smaller number.
KDF_ITERATIONS: Final = 600_000
