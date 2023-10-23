"""
ssh_key_management: Endpoints for managing SSH keys on the robot
"""
import contextlib
import functools
import hashlib
import ipaddress
import logging
import os
from aiohttp import web
from pathlib import Path
from typing import Any, Generator, IO, List, Tuple

from .handler_type import Handler


LOG = logging.getLogger(__name__)
SSH_DIR = Path(os.path.expanduser("~/.ssh"))
AUTHORIZED_KEYS = SSH_DIR / "authorized_keys"


def require_linklocal(handler: Handler) -> Handler:
    """Ensure the decorated is only called if the request is linklocal.

    The host ip address should be in the X-Host-IP header (provided by nginx)
    """

    @functools.wraps(handler)
    async def decorated(request: web.Request) -> web.Response:
        ipaddr_str = request.headers.get("x-host-ip")
        invalid_req_data = {
            "error": "bad-interface",
            "message": (
                f"The endpoint {request.rel_url}"
                f" can only be used from link-local connections."
                f" Make sure you're connected to this robot directly by cable"
                f" and using this robot's wired IP address"
                f" (not its wireless IP address)."
            ),
        }
        if not ipaddr_str:
            return web.json_response(  # type: ignore[no-untyped-call,no-any-return]
                data=invalid_req_data, status=403
            )
        try:
            addr = ipaddress.ip_address(ipaddr_str)
        except ValueError:
            LOG.exception(f"Couldn't parse host ip address {ipaddr_str}")
            raise

        if not addr.is_link_local:
            return web.json_response(  # type: ignore[no-untyped-call,no-any-return]
                data=invalid_req_data, status=403
            )

        return await handler(request)

    return decorated


@contextlib.contextmanager
def authorized_keys(mode: str = "r") -> Generator[IO[Any], None, None]:
    """Open the authorized_keys file. Separate function for mocking.

    :param mode: As :py:meth:`open`
    """
    path = os.path.expanduser("~/.ssh/authorized_keys")
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path))
        open(path, "w").close()
    with open(path, mode) as ak:
        yield ak


def get_keys() -> List[Tuple[str, str]]:
    """Return a list of tuples of [md5(pubkey), pubkey]"""
    with authorized_keys() as ak:
        return [
            (hashlib.new("md5", line.encode()).hexdigest(), line)
            for line in ak.read().split("\n")
            if line.strip()
        ]


def remove_by_hash(hashval: str) -> None:
    """Remove the key whose md5 sum matches hashval.

    :raises: KeyError if the hashval wasn't found
    """
    key_details = get_keys()
    with authorized_keys("w") as ak:
        for keyhash, key in key_details:
            if keyhash != hashval:
                ak.write(f"{key}\n")
                break
        else:
            raise KeyError(hashval)


def key_present(hashval: str) -> bool:
    """Check if the key whose md5 is hashval is in authorized_keys

    :returns: ``True`` if the key is present, ``False`` otherwise
    """
    return hashval in [keyhash for keyhash, _ in get_keys()]


def key_error(error: str, message: str, status: int = 400) -> web.Response:
    return web.json_response(  # type: ignore[no-untyped-call,no-any-return]
        data={"error": error, "message": message}, status=status
    )


@require_linklocal
async def list_keys(request: web.Request) -> web.Response:
    """List keys in the authorized_keys file.

    GET /server/ssh_keys
    -> 200 OK {"public_keys": [{"key_md5": md5 hex digest, "key": key string}]}

    (or 403 if not from the link-local connection)
    """
    return web.json_response(  # type: ignore[no-untyped-call,no-any-return]
        {
            "public_keys": [
                {"key_md5": details[0], "key": details[1]} for details in get_keys()
            ]
        },
        status=200,
    )


@require_linklocal
async def add(request: web.Request) -> web.Response:
    """Add a public key to the authorized_keys file.

    POST /server/ssh_keys {"key": key string}
    -> 201 Created

    If the key string doesn't look like an openssh public key, rejects with 400
    """

    body = await request.json()

    if "key" not in body or not isinstance(body["key"], str):
        return key_error("no-key", 'No "key" element in body')
    pubkey = body["key"]

    # Do some fairly minor sanitization; dropbear will ignore invalid keys but
    # we still don’t want to have a bunch of invalid data in there

    pubkey_parts = pubkey.split()
    if len(pubkey_parts) == 0:
        return key_error("bad-key", "Key is empty")

    alg = pubkey_parts[0]

    # We don’t allow dss so this has to be rsa or ecdsa and shouldn’t start
    # with restrictions
    if alg != "ssh-rsa" and not alg.startswith("ecdsa"):
        LOG.warning(f"weird keyfile uploaded: starts with {alg}")
        return key_error("bad-key", f"Key starts with invalid algorithm {alg}")

    if "\n" in pubkey[:-1]:
        LOG.warning("Newlines in keyfile that shouldn't be there")
        return key_error("bad-key", "Key has a newline")

    # This is a more or less correct key we can write
    if "\n" == pubkey[-1]:
        pubkey = pubkey[:-1]
    hashval = hashlib.new("md5", pubkey.encode()).hexdigest()
    if not key_present(hashval):
        with authorized_keys("a") as ak:
            ak.write(f"{pubkey}\n")

    return web.json_response(  # type: ignore[no-untyped-call,no-any-return]
        data={"message": f"Added key {hashval}", "key_md5": hashval}, status=201
    )


@require_linklocal
async def clear(request: web.Request) -> web.Response:
    """Clear all public keys from authorized_keys

    DELETE /server/ssh_keys
    -> 200 OK if successful

    (or 403 if not from the link-local connection)
    """
    with authorized_keys("w") as ak:
        ak.write("\n".join([]) + "\n")

    return web.json_response(  # type: ignore[no-untyped-call,no-any-return]
        data={
            "message": "Keys cleared. " "Restart robot to take effect",
            "restart_url": "/server/restart",
        },
        status=200,
    )


@require_linklocal
async def remove(request: web.Request) -> web.Response:
    """Remove a public key from authorized_keys

    DELETE /server/ssh_keys/:key_md5_hexdigest
    -> 200 OK if the key was found
    -> 404 Not Found otherwise
    """
    requested_hash = request.match_info["key_md5"]
    new_keys: List[str] = []
    found = False
    for keyhash, key in get_keys():
        if keyhash == requested_hash:
            found = True
        else:
            new_keys.append(key)

    if not found:
        return web.json_response(  # type: ignore[no-untyped-call,no-any-return]
            data={
                "error": "invalid-key-hash",
                "message": f"No such key md5 {requested_hash}",
            },
            status=404,
        )

    with authorized_keys("w") as ak:
        ak.write("\n".join(new_keys) + "\n")

    return web.json_response(  # type: ignore[no-untyped-call,no-any-return]
        data={
            "message": f"Key {requested_hash} deleted. " "Restart robot to take effect",
            "restart_url": "/server/restart",
        },
        status=200,
    )


async def add_from_local(request: web.Request) -> web.Response:
    """Add a public keys from usb device to the authorized_keys file.

    POST /server/ssh_keys/from_local
    -> 201 Created
    -> 404 Not Found otherwise

    """

    LOG.info("Searching for public keys in /media")
    pub_keys = [
        Path(root, file)
        for root, _, files in os.walk("/media")
        for file in files
        # skip hidden files
        if not file.startswith(".") and file.endswith(".pub")
    ]
    if not pub_keys:
        LOG.warning("No keys found")
        return key_error("no-key", "No valid keys found", 404)

    # Create the .ssh folder if it does not exist
    if not os.path.exists(SSH_DIR):
        os.mkdir(SSH_DIR, mode=0o700)

    # Update the existing keys if the ssh public key is valid
    new_keys = list()
    with open(AUTHORIZED_KEYS, "a") as fh:
        for key in pub_keys:
            try:
                with open(key, "r") as gh:
                    ssh_key = gh.read().strip()
                    if "ssh-rsa" not in ssh_key and "ecdsa" not in ssh_key:
                        LOG.warning(f"Invalid ssh public key: {key}")
                        continue
                    key_hash = hashlib.new("md5", ssh_key.encode()).hexdigest()
                    if not key_present(key_hash):
                        fh.write(f"{ssh_key}\n")
                        LOG.info(f"Added new rsa key: {key}")
                    new_keys.append(key_hash)
            except Exception as e:
                LOG.error(f"Could not process ssh public key: {key} {e}")
                continue

    return web.json_response(  # type: ignore[no-untyped-call,no-any-return]
        data={"message": f"Added {len(new_keys)} new keys", "key_md5": new_keys},
        status=201,
    )
