"""
ssh_key_management: Endpoints for managing SSH keys on the robot
"""
import contextlib
import functools
import hashlib
import ipaddress
import logging
import os
from typing import List, Tuple

from aiohttp import web

from .util import update_http_version

LOG = logging.getLogger(__name__)


def require_linklocal(handler):
    """ Ensure the decorated is only called if the request is linklocal.

    The host ip address should be in the X-Host-IP header (provided by nginx)
    """
    @functools.wraps(handler)
    async def decorated(request: web.Request) -> web.Response:
        ipaddr_str = request.headers.get('x-host-ip')
        invalid_req_data = {
            'error': 'bad-interface',
            'message': f'The endpoint {request.url} can only be used from '
            'local connections'
        }
        if not ipaddr_str:
            return web.json_response(
                data=invalid_req_data,
                status=403)
        try:
            addr = ipaddress.ip_address(ipaddr_str)
        except ValueError:
            LOG.exception(f"Couldn't parse host ip address {ipaddr_str}")
            raise

        if not addr.is_link_local:
            return web.json_response(data=invalid_req_data, status=403)

        return await handler(request)
    return decorated


@contextlib.contextmanager
def authorized_keys(mode='r'):
    """ Open the authorized_keys file. Separate function for mocking.

    :param mode: As :py:meth:`open`
    """
    path = '/var/home/.ssh/authorized_keys'
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path))
        open(path, 'w').close()
    with open(path, mode) as ak:
        yield ak


def get_keys() -> List[Tuple[str, str]]:
    """ Return a list of tuples of [md5(pubkey), pubkey] """
    with authorized_keys() as ak:
        return [(hashlib.new('md5', line.encode()).hexdigest(),
                 line)
                for line in ak.read().split('\n')
                if line.strip()]


def remove_by_hash(hashval: str):
    """ Remove the key whose md5 sum matches hashval.

    :raises: KeyError if the hashval wasn't found
    """
    key_details = get_keys()
    with authorized_keys('w') as ak:
        for keyhash, key in key_details:
            if keyhash != hashval:
                ak.write(f'{key}\n')
                break
        else:
            raise KeyError(hashval)


def key_present(hashval: str) -> bool:
    """ Check if the key whose md5 is hashval is in authorized_keys

    :returns: ``True`` if the key is present, ``False`` otherwise
    """
    return hashval in [keyhash for keyhash, _ in get_keys()]


@require_linklocal
@update_http_version(1, 0)
async def list_keys(request: web.Request) -> web.Response:
    """ List keys in the authorized_keys file.

    GET /server/ssh_keys
    -> 200 OK {"public_keys": [{"key_md5": md5 hex digest, "key": key string}]}

    (or 403 if not from the link-local connection)
    """
    return web.json_response(
        {'public_keys': [{'key_md5': details[0], 'key': details[1]}
                         for details in get_keys()]},
        status=200)


@require_linklocal
@update_http_version(1, 0)
async def add(request: web.Request) -> web.Response:
    """ Add a public key to the authorized_keys file.

    POST /server/ssh_keys {"key": key string}
    -> 201 Created

    If the key string doesn't look like an openssh public key, rejects with 400
    """
    body = await request.json()
    if 'key' not in body or not isinstance(body['key'], str):
        return web.json_response(
            data={'error': 'no-key', 'message': 'No "key" element in body'},
            status=400)
    pubkey = body['key']
    # Do some fairly minor sanitization; dropbear will ignore invalid keys but
    # we still don’t want to have a bunch of invalid data in there
    alg = pubkey.split()[0]
    # We don’t allow dss so this has to be rsa or ecdsa and shouldn’t start
    # with restrictions
    if alg != 'ssh-rsa' and not alg.startswith('ecdsa'):
        LOG.warning(f"weird keyfile uploaded: starts with {alg}")
        return web.json_response(
            data={'error': 'bad-key',
                  'message': f'Key starts with invalid algorithm {alg}'},
            status=400)
    if '\n' in pubkey[:-1]:
        LOG.warning(f"Newlines in keyfile that shouldn't be there")
        return web.json_response(
            data={'error': 'bad-key', 'message': f'Key has a newline'},
            status=400)

    if '\n' == pubkey[-1]:
        pubkey = pubkey[:-1]

    # This is a more or less correct key we can write
    hashval = hashlib.new('md5', pubkey.encode()).hexdigest()
    if not key_present(hashval):
        with authorized_keys('a') as ak:
            ak.write(f'{pubkey}\n')

    return web.json_response(
            data={'message': f'Added key {hashval}',
                  'key_md5': hashval},
            status=201)


@require_linklocal
@update_http_version(1, 0)
async def clear(request: web.Request) -> web.Response:
    """ Clear all public keys from authorized_keys

    DELETE /server/ssh_keys
    -> 200 OK if successful

    (or 403 if not from the link-local connection)
    """
    with authorized_keys('w') as ak:
        ak.write('\n'.join([]) + '\n')

    return web.json_response(
        data={
            'message': f'Keys cleared. '
            'Restart robot to take effect',
            'restart_url': '/server/restart'},
        status=200)


@require_linklocal
@update_http_version(1, 0)
async def remove(request: web.Request) -> web.Response:
    """ Remove a public key from authorized_keys

    DELETE /server/ssh_keys/:key_md5_hexdigest
    -> 200 OK if the key was found
    -> 404 Not Found otherwise
    """
    requested_hash = request.match_info['key_md5']
    new_keys: List[str] = []
    found = False
    for keyhash, key in get_keys():
        if keyhash == requested_hash:
            found = True
        else:
            new_keys.append(key)

    if not found:
        return web.json_response(
            data={'error': 'invalid-key-hash',
                  'message': f'No such key md5 {requested_hash}'},
            status=404)

    with authorized_keys('w') as ak:
        ak.write('\n'.join(new_keys) + '\n')

    return web.json_response(
        data={
            'message': f'Key {requested_hash} deleted. '
            'Restart robot to take effect',
            'restart_url': '/server/restart'},
        status=200)
