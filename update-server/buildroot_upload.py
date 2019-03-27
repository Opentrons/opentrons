""" buildroot_update.py: client script for running buildroot updates

This can be used in place of the opentrons app to do updates of buildroot
systems from update zips. Note that if you just want to do dev scale work
of modifying the api server, you can probably use the update-api-buildroot
makefile target in the api project.

This requires aiohttp
"""

import argparse
import asyncio
import json
import sys

import aiohttp


async def poll_status(sess, token, root):
    resp = await sess.get(root + '/' + token + '/status')
    return await resp.json()


async def do_update(update_file, host):
    async with aiohttp.ClientSession() as session:
        root = host + '/server/update'
        print(f"Starting update of {update_file.name} to {host}")
        begin_resp = await session.post(root + '/begin')
        assert begin_resp.status == 201,\
            f'Error response from host: {begin_resp.status}'
        begin_body = await begin_resp.json()
        token = begin_body['token']
        print(f"Uploading file...")
        file_resp = await session.post(root + '/' + token + '/file',
                                       data={'ot2-system.zip': update_file})
        if file_resp.status != 201:
            body = await file_resp.text()
            try:
                json_resp = json.loads(body)
            except json.JSONDecodeError:
                message = body
            else:
                message = f'{json_resp["error"]}: {json_resp["message"]}'
            print(f'Error uploading file: {message}')
            sys.exit(-1)

        status = await file_resp.json()
        while status['stage'] == 'validating':
            sys.stdout.write(
                f'{status["message"]}: {status["progress"]*100:.0f}%\r')
            status = await poll_status(session, token, root)

        if status['stage'] == 'error':
            print(f'Error validating: {status["error"]}: {status["message"]}')
            sys.exit(-1)

        while status['stage'] == 'writing':
            sys.stdout.write(
                f'{status["message"]}: {status["progress"]*100:.0f}%\r')
            status = await poll_status(session, token, root)

        if status['stage'] == 'error':
            print(f'Error writing: {status["error"]}: {status["message"]}')
            sys.exit(-1)

        if status['stage'] == 'done':
            print("Committing update...")
            resp = await session.post(root + '/' + token + '/commit')
            if resp.status != 200:
                print(f'Error committing: {status["error"]}: '
                      f'{status["message"]}')
                sys.exit(-1)

            print("Restarting...")
            resp = await session.post(host+'/server/update/restart')

        print("Done!")


def assure_host(host_arg):
    if not host_arg.startswith('http'):
        host_arg = 'http://' + host_arg
    if not host_arg.endswith(':31950'):
        host_arg = host_arg + ':31950'
    return host_arg


def main():
    parser = argparse.ArgumentParser(description='update buildroot systems')
    parser.add_argument('update', metavar='UPDATE_FILE',
                        type=argparse.FileType('rb'),
                        help='The ot2-system.zip to upload')
    parser.add_argument('host', metavar='ROBOT HOSTNAME',
                        type=str,
                        help='The IP of the robot')
    args = parser.parse_args()
    asyncio.get_event_loop().run_until_complete(
        do_update(args.update, assure_host(args.host)))


if __name__ == '__main__':
    main()
