""" oe_upload.py: client script for running OE updates

This requires aiohttp
"""

import argparse
import asyncio
import json
import sys

import aiohttp


# TODO (al, 2022-04-18): This separate script should be refactored. It and
#  buildroot_upload.py should be merged into one script.


async def poll_status(sess, token, root):
    await asyncio.sleep(1.0)
    resp = await sess.get(root + '/' + token + '/status')
    return await resp.json()


async def do_update(update_file: str, host: str,
                    pause_between_steps: bool = False):
    timeout = aiohttp.ClientTimeout(total=7200)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        root = host + '/server/update'
        filename = "system-update.zip"
        print(f"Starting update of {update_file.name} to {host}")
        begin_resp = await session.post(root + '/begin')
        if begin_resp.status == 409:
            should_cancel = input(
                'Another update is in process! Cancel [yN]? ')
            if should_cancel.lower()[0] == 'y':
                cancel_resp = await session.post(root + '/cancel')
                if cancel_resp.status != 200:
                    body = await cancel_resp.text()
                    sys.stderr.write(
                        f"Error response from host when canceling: "
                        f"{cancel_resp.status}: {body}\n")
                    sys.exit(-1)
                begin_resp = await session.post(root + '/begin')

        if begin_resp.status != 201:
            body = await begin_resp.text()
            sys.stderr.write(
                f'Error response from host: {begin_resp.status}: {body}')
            sys.exit(-1)

        begin_body = await begin_resp.json()
        token = begin_body['token']

        msg = f'Session created at {root}/{token}'
        if pause_between_steps:
            input(f'{msg}. Press enter to continue to upload and validation')
        else:
            print(msg)

        print(f"Uploading file...")
        file_resp = await session.post(root + '/' + token + '/file',
                                       data={filename: update_file})
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
                f'{status["message"]}: {status["progress"] * 100:.0f}%\r')
            status = await poll_status(session, token, root)
        print(msg)
        if status['stage'] == 'error':
            print(f'Error validating: {status["error"]}: {status["message"]}')
            sys.exit(-1)

        while status['stage'] == 'writing':
            sys.stdout.write(
                f'{status["message"]}: {status["progress"] * 100:.0f}%\r')
            status = await poll_status(session, token, root)

        if status['stage'] == 'error':
            print(f'Error writing: {status["error"]}: {status["message"]}')
            sys.exit(-1)

        msg = 'File written and validated'
        if pause_between_steps:
            input(f'{msg}. Press enter to continue to commit')
        else:
            print(msg)

        if status['stage'] == 'done':
            print("Committing update...")
            resp = await session.post(root + '/' + token + '/commit')
            if resp.status != 200:
                print(f'Error committing: {status["error"]}: '
                      f'{status["message"]}')
                sys.exit(-1)

        msg = 'Update committed'
        if pause_between_steps:
            input(f'{msg}. Press enter to continue to restart')
        else:
            print(msg)

        print("Restarting...")
        resp = await session.post(host + '/server/restart')
        if resp.status != 200:
            try:
                body = await resp.json()
                print(f'Error restarting: {resp.status}: '
                      f'{body["error"]: body["message"]}')
            except (json.JSONDecodeError,
                    KeyError,
                    aiohttp.client_exceptions.ContentTypeError):
                body = await resp.text()
                print(f'Error restarting: {resp.status}: {body}')
            sys.exit(-1)

        print("Done!")


def assure_host(host_arg):
    if not host_arg.startswith('http'):
        host_arg = 'http://' + host_arg
    if not host_arg.endswith(':31950'):
        host_arg = host_arg + ':31950'
    return host_arg


def main():
    parser = argparse.ArgumentParser(description='update OE systems')
    parser.add_argument('update', metavar='UPDATE_FILE',
                        type=argparse.FileType('rb'),
                        help='The OT3/OE root file system to upload')
    parser.add_argument('host', metavar='ROBOT HOSTNAME',
                        type=str,
                        help='The IP of the robot')
    parser.add_argument('-s', '--step-by-step', action='store_true',
                        help='Pause until the user hits enter in between each '
                             'stage. Useful for dev workflows')

    args = parser.parse_args()
    asyncio.get_event_loop().run_until_complete(
        do_update(
            args.update,
            assure_host(args.host),
            pause_between_steps=args.step_by_step))


if __name__ == '__main__':
    main()
