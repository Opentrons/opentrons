"""oe_upload.py: client script for running OE updates

This requires aiohttp
"""

import argparse
import asyncio
import getpass
import json
import sys
from typing import Any, BinaryIO, Literal

import aiohttp

# The client_id that auth-server expects in OAuth 2 requests.
CLIENT_ID = "opentrons_app"


async def poll_status(sess: aiohttp.ClientSession, token: str, root: str) -> Any:
    await asyncio.sleep(1.0)
    resp = await sess.get(root + "/" + token + "/status")
    return await resp.json()


async def log_in(
    session: aiohttp.ClientSession, host: str, username: str, password: str
) -> str:
    """Exchange a username and password for an access token.

    The token is issued with whatever scopes the account has; the update flow
    needs updates.write and restart.write.
    """
    print(f"Logging in as {username}...")
    resp = await session.post(
        host + "/auth/oauth2/token",
        data={
            "client_id": CLIENT_ID,
            "grant_type": "password",
            "username": username,
            "password": password,
        },
    )
    body = await resp.text()
    if resp.status != 200:
        try:
            error = json.loads(body)
            message = f"{error['error']}: {error['error_description']}"
        except (json.JSONDecodeError, KeyError):
            message = body
        sys.stderr.write(f"Error logging in: {resp.status}: {message}\n")
        sys.exit(-1)
    token = json.loads(body)["access_token"]
    assert isinstance(token, str), "Invalid return from OAuth2 token route"
    return token


async def do_update(  # noqa: C901
    update_file: BinaryIO,
    host: str,
    mode: Literal["auto", "sbs", "normal"],
    username: str | None = None,
    password: str | None = None,
) -> None:
    timeout = aiohttp.ClientTimeout(total=7200)

    headers = {}
    if username is not None and password is not None:
        async with aiohttp.ClientSession(timeout=timeout) as login_session:
            access_token = await log_in(login_session, host, username, password)
        headers["Authorization"] = f"Bearer {access_token}"
        headers["Opentrons-User-Notes"] = "a" * 128

    async with aiohttp.ClientSession(timeout=timeout, headers=headers) as session:
        root = host + "/server/update"
        filename = "system-update.zip"
        print(f"Starting update of {update_file.name} to {host}")
        begin_data = {"auto_commit_and_restart": mode == "auto"}
        begin_resp = await session.post(root + "/begin", json=begin_data)
        if begin_resp.status == 409:
            should_cancel = input("Another update is in process! Cancel [yN]? ")
            if should_cancel.lower()[0] == "y":
                cancel_resp = await session.post(root + "/cancel")
                if cancel_resp.status != 200:
                    body = await cancel_resp.text()
                    sys.stderr.write(
                        f"Error response from host when canceling: "
                        f"{cancel_resp.status}: {body}\n"
                    )
                    sys.exit(-1)
                begin_resp = await session.post(root + "/begin", json=begin_data)

        if begin_resp.status != 201:
            body = await begin_resp.text()
            sys.stderr.write(f"Error response from host: {begin_resp.status}: {body}")
            sys.exit(-1)

        begin_body = await begin_resp.json()
        token = begin_body["token"]

        msg = f"Session created at {root}/{token}"
        if mode == "sbs":
            input(f"{msg}. Press enter to continue to upload and validation")
        else:
            print(msg)

        print("Uploading file...")
        file_resp = await session.post(
            root + "/" + token + "/file", data={filename: update_file}
        )
        if file_resp.status != 201:
            body = await file_resp.text()
            try:
                json_resp = json.loads(body)
            except json.JSONDecodeError:
                message = body
            else:
                message = f"{json_resp['error']}: {json_resp['message']}"
            print(f"Error uploading file: {message}")
            sys.exit(-1)

        status = await file_resp.json()
        while status["stage"] == "awaiting-file":
            sys.stdout.write("waiting for validation to begin\r\n")
            status = await poll_status(session, token, root)

        while status["stage"] == "validating":
            sys.stdout.write(f"{status['message']}: {status['progress'] * 100:.0f}%\r")
            status = await poll_status(session, token, root)
        print(msg)
        if status["stage"] == "error":
            print(f"Error validating: {status['error']}: {status['message']}")
            sys.exit(-1)

        while status["stage"] == "writing":
            sys.stdout.write(f"{status['message']}: {status['progress'] * 100:.0f}%\r")
            status = await poll_status(session, token, root)

        if status["stage"] == "error":
            print(f"Error writing: {status['error']}: {status['message']}")
            sys.exit(-1)

        msg = "File written and validated"
        if mode == "sbs":
            input(f"{msg}. Press enter to continue to commit")
        else:
            print(msg)

        if status["stage"] == "done":
            print("Committing update...")
            resp = await session.post(root + "/" + token + "/commit")
            if resp.status != 200:
                print(f"Error committing: {status['error']}: {status['message']}")
                sys.exit(-1)

        msg = "Update committed"
        if mode == "sbs":
            input(f"{msg}. Press enter to continue to restart")
        else:
            print(msg)

        print("Restarting...")
        resp = await session.post(host + "/server/restart")
        if resp.status != 200:
            try:
                body = await resp.json()
                print(
                    f'Error restarting: {resp.status}: {body["error"]: body["message"]}'
                )
            except (
                json.JSONDecodeError,
                KeyError,
                aiohttp.client_exceptions.ContentTypeError,
            ):
                body = await resp.text()
                print(f"Error restarting: {resp.status}: {body}")
            sys.exit(-1)

        print("Done!")


def assure_host(host_arg: str) -> str:
    if not host_arg.startswith("http"):
        host_arg = "http://" + host_arg
    if not host_arg.endswith(":31950"):
        host_arg = host_arg + ":31950"
    return host_arg


def main() -> None:
    parser = argparse.ArgumentParser(description="update OE systems")
    parser.add_argument(
        "update",
        metavar="UPDATE_FILE",
        type=argparse.FileType("rb"),
        help="The OT3/OE root file system to upload",
    )
    parser.add_argument(
        "host", metavar="ROBOT HOSTNAME", type=str, help="The IP of the robot"
    )
    parser.add_argument(
        "--username",
        type=str,
        action="store",
        default=None,
        help="Log in as this user and authorize requests with the resulting access"
        " token. If omitted, requests are sent unauthenticated, which only works if"
        " the robot has access control disabled.",
    )
    parser.add_argument(
        "--password",
        type=str,
        action="store",
        default=None,
        help="The password to log in with. If omitted, you are prompted for it,"
        " which keeps it out of your shell history and the process list. Pass it"
        " here if your terminal can't prompt (some Windows shells).",
    )
    style = parser.add_mutually_exclusive_group()
    style.add_argument(
        "-s",
        "--step-by-step",
        action="store_true",
        help="Pause until the user hits enter in between each stage. Useful for dev workflows",
    )
    style.add_argument(
        "-a",
        "--auto",
        action="store_true",
        help='Run "automatically", where after file upload the robot proceeds with the update without needing further input',
    )

    args = parser.parse_args()
    if args.password is not None and args.username is None:
        parser.error("--password requires --username.")

    password = args.password
    if args.username is not None and password is None:
        password = getpass.getpass(f"Password for {args.username}: ")

    def _mode_from_args(auto: bool, sbs: bool) -> Literal["auto", "sbs", "normal"]:
        if auto:
            return "auto"
        if sbs:
            return "sbs"
        return "normal"

    asyncio.get_event_loop().run_until_complete(
        do_update(
            args.update,
            assure_host(args.host),
            mode=_mode_from_args(args.auto, args.step_by_step),
            username=args.username,
            password=password,
        )
    )


if __name__ == "__main__":
    main()
