"""Off-robot Slack Events API service that posts AI analysis of error videos.

This is a single central HTTP service (NOT on any robot). It is wired to the
EXISTING ABR Slack app via an Event Subscription pointing at POST
/slack/events. When a robot uploads an error video into an alert thread, Slack
delivers a message event here; the service downloads the video, runs Gemini
analysis, and replies in the same thread.

Running it centrally covers every robot at once and keeps three concerns
separate: the robots only post alerts, the Slack app only forwards events, and
the LLM call is isolated in this service (via analyze_video). No robot needs
google-genai.

Slack requires a 200 response within ~3 seconds, so the endpoint verifies the
request, acks immediately, and does the (slow) download + LLM + post work in a
background thread.

Environment variables:
    SLACK_BOT_TOKEN        xoxb-... the EXISTING ABR app's bot token
    SLACK_SIGNING_SECRET   from the app's Basic Information (verifies requests)
    GEMINI_API_KEY         Google Gemini API key
    ABR_ALERTS_CHANNEL_ID  optional; if set, only this channel id is processed

Run:
    pipenv run uvicorn \\
        abr_testing.automation.slack_error_analyzer_api:app --host 0.0.0.0 --port 3000

Then expose that port to Slack over HTTPS (reverse proxy / tunnel) and set the
app's Event Subscriptions Request URL to https://<your-host>/slack/events.
"""
import json
import os
import tempfile
import urllib.request
from typing import Optional

from fastapi import BackgroundTasks, FastAPI, Request, Response
from slack_sdk import WebClient
from slack_sdk.signature import SignatureVerifier

from abr_testing.automation.ai_analysis import analyze_video

VIDEO_EXTENSIONS = ("mp4", "mov", "avi", "mkv")
# Must match the phrasing in slack.py:send_error_message so we only analyze
# videos attached to genuine error threads.
ERROR_MARKER = "ended in error"
DOWNLOAD_TIMEOUT_S = 120

app = FastAPI()
_client = WebClient(token=os.environ["SLACK_BOT_TOKEN"])
_verifier = SignatureVerifier(os.environ["SLACK_SIGNING_SECRET"])
# Optional single-channel restriction (defense-in-depth on top of the app only
# being a member of #abr-robot-alerts).
_alerts_channel = os.environ.get("ABR_ALERTS_CHANNEL_ID")
# In-memory guard so Slack event retries don't trigger duplicate analyses.
# Resets on restart, which at worst re-analyzes a video once - acceptable.
_processed_files: set = set()


def _is_video(file_obj: dict) -> bool:
    """Return True if a Slack file object looks like a video."""
    filetype = (file_obj.get("filetype") or "").lower()
    name = (file_obj.get("name") or "").lower()
    return filetype in VIDEO_EXTENSIONS or name.endswith(
        tuple(f".{ext}" for ext in VIDEO_EXTENSIONS)
    )


def _thread_is_error(channel: str, thread_ts: str) -> bool:
    """Return True if the thread's root message is a robot error alert."""
    try:
        resp = _client.conversations_replies(channel=channel, ts=thread_ts, limit=1)
    except Exception as e:
        print(f"Could not fetch thread root {thread_ts}: {e}")
        return False
    messages = resp.get("messages", [])
    if not messages:
        return False
    return ERROR_MARKER in (messages[0].get("text") or "").lower()


def _download_file(file_obj: dict) -> Optional[str]:
    """Download a Slack file to a temp path using the bot token."""
    url = file_obj.get("url_private_download") or file_obj.get("url_private")
    if not url:
        return None
    token = os.environ["SLACK_BOT_TOKEN"]
    suffix = os.path.splitext(file_obj.get("name") or "")[1] or ".mp4"
    req = urllib.request.Request(
        url, headers={"Authorization": f"Bearer {token}"}
    )
    fd, path = tempfile.mkstemp(suffix=suffix)
    with urllib.request.urlopen(req, timeout=DOWNLOAD_TIMEOUT_S) as resp:
        with os.fdopen(fd, "wb") as file_content:
            file_content.write(resp.read())
    return path


def process_event(event: dict) -> None:
    """Download the error video, run AI analysis, and reply in-thread.

    Runs in a background thread (FastAPI runs sync background tasks in a
    threadpool) so the /slack/events endpoint can ack Slack within 3 seconds.
    """
    files = event.get("files")
    if not files:
        return
    channel = event.get("channel")
    # Robots upload the video into the error thread, so thread_ts is set.
    thread_ts = event.get("thread_ts") or event.get("ts")
    if not channel or not thread_ts:
        return
    if _alerts_channel and channel != _alerts_channel:
        return

    for file_obj in files:
        if not _is_video(file_obj):
            continue
        file_id = file_obj.get("id", "")
        if file_id in _processed_files:
            continue
        if not _thread_is_error(channel, thread_ts):
            continue
        _processed_files.add(file_id)

        video_path = None
        try:
            video_path = _download_file(file_obj)
            if not video_path:
                print(f"No download URL for file {file_id}")
                continue
            analysis = analyze_video(video_path, os.environ["GEMINI_API_KEY"])
        except Exception as e:
            print(f"AI analysis failed for file {file_id}: {e}")
            continue
        finally:
            if video_path:
                try:
                    os.remove(video_path)
                except OSError:
                    pass

        if not analysis:
            continue

        try:
            _client.chat_postMessage(
                channel=channel,
                thread_ts=thread_ts,
                text=f"*AI Video Analysis:*\n{analysis}",
            )
        except Exception as e:
            print(f"Failed to post analysis for file {file_id}: {e}")


@app.post("/slack/events")
async def slack_events(
    request: Request, background_tasks: BackgroundTasks
) -> Response:
    """Verify the Slack request, ack immediately, and offload heavy work."""
    body = await request.body()
    if not _verifier.is_valid_request(body, dict(request.headers)):
        return Response(status_code=401)

    payload = json.loads(body)
    # One-time URL verification handshake when configuring the Request URL.
    if payload.get("type") == "url_verification":
        return Response(
            content=payload.get("challenge", ""), media_type="text/plain"
        )

    event = payload.get("event", {})
    if event.get("type") == "message" and event.get("files"):
        background_tasks.add_task(process_event, event)
    # Ack fast; anything slow already handed off to the background thread.
    return Response(status_code=200)
