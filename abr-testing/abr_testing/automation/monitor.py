#!/usr/bin/env python3
"""
Opentrons run monitor + error clip recorder.

Continuously watches one or more Opentrons robots over their HTTP API
(port 31950). While a run is active it records the robot's live HLS camera
feed into a rolling buffer with ffmpeg. The moment the run enters error
recovery, fails, or reports a command error, it saves the last N seconds of
footage (default 2 minutes) as an .mp4 plus a .json describing the error, and
optionally fires a notification.

Designed to run headless and unattended (e.g. as a systemd service on a
Raspberry Pi). One background thread per robot; the main thread just supervises.

Usage:
    python3 monitor.py --config config.yaml

Requires: Python 3.8+, ffmpeg on PATH, `requests`, `PyYAML`.
"""

from __future__ import annotations

import argparse
import configparser
import logging
import math
import os
import shutil
import signal
import subprocess
import threading
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from read_robot_logs import get_logs

import requests

try:
    import yaml
except ImportError:  # pragma: no cover
    raise SystemExit("Missing dependency PyYAML. Install with: pip install -r requirements.txt")


log = logging.getLogger("monitor")

# Run statuses that mean a run exists and is executing (so we should record).
ACTIVE_STATUSES = {
    "running",
    "paused",
    "finishing",
    "blocked-by-open-door",
    "awaiting-recovery",
    "awaiting-recovery-paused",
    "awaiting-recovery-blocked-by-open-door",
    "stop-requested",
}

ERROR_STATUSES = {
    "awaiting-recovery",
    "awaiting-recovery-paused",
    "awaiting-recovery-blocked-by-open-door",
}
# Run statuses that mean the run is over; stop recording and clean up.
TERMINAL_STATUSES = {"succeeded", "failed", "stopped"}

# When a robot's HLS stream is unavailable, ffmpeg exits immediately and the
# recorder stops running, so a naive "restart if not running" loop respawns it
# every poll. Once we've seen this many consecutive failed starts we conclude
# the stream is down and only retry every STREAM_RETRY_BACKOFF seconds.
STREAM_DOWN_AFTER_FAILURES = 0 #TODO: fix this memory leak??
STREAM_RETRY_BACKOFF = 60.0
# Ignore all error triggers for this long after the watcher starts so a robot
# already sitting in error recovery doesn't immediately alert (no video buffer
# yet) and latch recovery_reported before normal monitoring begins.
STARTUP_GRACE_SECONDS = 60.0


def utcstamp() -> str:
    """Filesystem-safe UTC timestamp, e.g. 20260611T200145Z."""
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


# --------------------------------------------------------------------------- #
# Config
# --------------------------------------------------------------------------- #
@dataclass
class ClipConfig:
    pre_error_seconds: int = 120
    post_error_seconds: int = 10      # keep recording this long after an error
    segment_seconds: int = 10
    buffer_seconds: int = 180
    cooldown_seconds: int = 60
    max_clips: int = 5             # keep only the N most recent saved clips


@dataclass
class TriggerConfig:
    on_error_recovery: bool = True
    on_failed: bool = True
    on_command_error: bool = True


@dataclass
class NotifyConfig:
    enabled: bool = False
    type: str = "none"  # slack | webhook | none

    # --- type: "slack" (slack_sdk bot, can upload the clip file) ---
    # Shared Slack key for all robots. Provide ONE of:
    #   token_ini:  abr-style config.ini with [DEFAULT] slack_token = xoxb-...
    #   token_file: a plain file whose contents are the xoxb-... token
    token_ini: str = ""
    token_file: str = ""
    channel: str = ""                 # default channel (robots can override)
    username: str = ""                # blank -> poster name defaults to robot name
    upload_clip: bool = True          # attach the mp4 (and .json) to the message

    # --- type: "webhook" (Slack Incoming Webhook or any JSON endpoint) ---
    webhook_url: str = ""
    webhook_format: str = "slack"     # slack -> {"text": ...} | generic -> full JSON


@dataclass
class RobotConfig:
    name: str
    ip: str
    # Per-robot Slack settings. The token comes from the shared notify.token_ini
    # by default; set config_ini only to override the key for this one robot.
    slack_channel: str = ""           # falls back to notify.channel if empty
    slack_username: str = ""          # falls back to notify.username if empty
    config_ini: str = ""              # optional per-robot key override


@dataclass
class Config:
    poll_interval_seconds: float = 3.0
    opentrons_version: str = "2"
    output_dir: str = "./clips"
    work_dir: str = "./recordings"
    clip: ClipConfig = field(default_factory=ClipConfig)
    triggers: TriggerConfig = field(default_factory=TriggerConfig)
    notify: NotifyConfig = field(default_factory=NotifyConfig)
    robots: list[RobotConfig] = field(default_factory=list)


def load_config(path: str, storage_dir: Path) -> Config:
    with open(path, "r") as fh:
        raw = yaml.safe_load(fh) or {}

    def resolve_path(p: str | None, default: str = "") -> str:
        """Resolves relative paths against the storage directory. Leaves absolute paths alone."""
        p = str(p or default)
        if not p:
            return ""
        # Expand '~' and resolve against storage_dir if it's a relative path
        expanded = os.path.expanduser(p)
        if os.path.isabs(expanded):
            return expanded
        return str(storage_dir / p)

    robots = [
        RobotConfig(
            name=str(r["name"]),
            ip=str(r["ip"]),
            slack_channel=str(r.get("slack_channel", "")),
            slack_username=str(r.get("slack_username", "")),
            config_ini=resolve_path(r.get("config_ini", "")),
        )
        for r in raw.get("robots", [])
    ]
    if not robots:
        raise SystemExit("No robots defined in config. Add at least one under 'robots:'.")

    raw_notify = raw.get("notify") or {}
    notify_cfg = NotifyConfig(
        enabled=bool(raw_notify.get("enabled", False)),
        type=str(raw_notify.get("type", "none")),
        token_ini=resolve_path(raw_notify.get("token_ini", "")),
        token_file=resolve_path(raw_notify.get("token_file", "")),
        channel=str(raw_notify.get("channel", "")),
        username=str(raw_notify.get("username", "")),
        upload_clip=bool(raw_notify.get("upload_clip", True)),
        webhook_url=str(raw_notify.get("webhook_url", "")),
        webhook_format=str(raw_notify.get("webhook_format", "slack")),
    )

    return Config(
        poll_interval_seconds=float(raw.get("poll_interval_seconds", 3.0)),
        opentrons_version=str(raw.get("opentrons_version", "2")),
        output_dir=resolve_path(raw.get("output_dir", "./clips")),
        work_dir=resolve_path(raw.get("work_dir", "./recordings")),
        clip=ClipConfig(**(raw.get("clip") or {})),
        triggers=TriggerConfig(**(raw.get("triggers") or {})),
        notify=notify_cfg,
        robots=robots,
    )


# --------------------------------------------------------------------------- #
# Notifications
# --------------------------------------------------------------------------- #
def _read_token_file(path: str) -> str:
    if not path:
        raise SystemExit("A Slack token file path is required but was empty.")
    try:
        with open(os.path.expanduser(path), "r") as fh:
            token = fh.read().strip()
    except FileNotFoundError:
        raise SystemExit(
            f"Slack token file '{path}' not found. Create it with your bot token, e.g.:\n"
            f"    echo 'xoxb-your-token' > {path} && chmod 600 {path}"
        )
    if not token:
        raise SystemExit(f"Slack token file '{path}' is empty.")
    return token


def _format_message(robot_name: str, meta: dict) -> str:
    reason = meta.get('reason')
    protocol = meta.get('protocol_name')
    if reason == "run_started":
        return (
            f":rocket: Protocol: {protocol} has started.\n"
        )
    if reason == "error_recovery_instant":
        return(f":eyes: *{robot_name}* is in error recovery mode :eyes:\n")
    
    if reason == "run_finished":
        return(f":tada: Protocol {protocol} has finished :tada:")
    
    
    return (
        f":rotating_light: *{robot_name}* error clip saved\n"
        f"> reason: {meta.get('reason')}\n"
        f"> status: {meta.get('status')}\n"
        f"> run: {meta.get('run_id')}\n"
        f"> detail: {meta.get('error_detail') or 'n/a'}\n"
        f"> file: {os.path.basename(meta.get('clip_path') or '') or 'n/a'}"
    )


class WebhookNotifier:
    """Posts to a Slack Incoming Webhook or any JSON endpoint (no file upload)."""

    def __init__(self, cfg: NotifyConfig):
        self.url = cfg.webhook_url
        self.fmt = cfg.webhook_format

    def notify(self, robot_name: str, meta: dict) -> None:
        if not self.url:
            return
        try:
            if self.fmt == "slack":
                requests.post(self.url, json={"text": _format_message(robot_name, meta)}, timeout=10)
            else:
                requests.post(self.url, json=meta, timeout=10)
            log.debug("[%s] webhook notification sent", robot_name)
        except requests.RequestException as exc:
            log.warning("[%s] webhook notification failed: %s", robot_name, exc)


class SlackNotifier:
    """Slack bot notifier (modeled on opentrons/abr-testing automation/slack.py).

    Posts a parent message then uploads the clip (and its .json) into the thread.
    Build it either from a token file (global config) or from a per-robot
    config.ini via SlackNotifier.from_ini().
    """

    def __init__(self, token: str, channel: str,
                 username: str = "robot-monitor", upload_clip: bool = True,
                 gemini_api_key: str = ""):
        try:
            from slack_sdk import WebClient
        except ImportError as exc:  # pragma: no cover
            raise SystemExit(
                "Slack notifications requested but slack_sdk is not installed. "
                "Run: pip install -r requirements.txt"
            ) from exc

        self.client = WebClient(token=token)
        self.channel = channel
        self.username = username
        self.upload_clip = upload_clip
        self.gemini_api_key = gemini_api_key
        self.channel_id = self._channel_id_from_name(channel)
        if self.channel_id is None:
            log.warning("Slack channel '%s' not found (file upload may fail); "
                        "is the bot invited to it?", channel)

    @classmethod
    def from_token_file(cls, token_file: str, channel: str,
                        username: str = "robot-monitor", upload_clip: bool = True) -> "SlackNotifier":
        return cls(_read_token_file(token_file), channel, username, upload_clip)

    def _channel_id_from_name(self, channel_name: str) -> str | None:
        # Try public+private first; if the token lacks groups:read, fall back to
        # public only so the lookup still works.
        for types in ("public_channel,private_channel", "public_channel"):
            cursor = None
            try:
                while True:
                    resp = self.client.conversations_list(
                        exclude_archived=True, limit=1000, cursor=cursor, types=types,
                    )
                    for ch in resp.get("channels", []):
                        if ch.get("name") == channel_name:
                            return ch["id"]
                    cursor = (resp.get("response_metadata") or {}).get("next_cursor")
                    if not cursor:
                        break
                return None  # listed successfully but name not present
            except Exception as exc:  # noqa: BLE001 - best-effort, try next types
                if "missing_scope" in str(exc) and types != "public_channel":
                    continue
                log.warning("Slack channel lookup failed: %s", exc)
                return None
        return None

    def notify(self, robot_name: str, meta: dict) -> None:
        text = _format_message(robot_name, meta)
        try:
            parent = self.client.chat_postMessage(
                channel=self.channel,
                text=text,
                username=self.username,
                icon_emoji=":movie_camera:",
            )
            thread_ts = parent["ts"]
        except Exception as exc:  # noqa: BLE001
            log.warning("[%s] Slack message failed: %s", robot_name, exc)
            return

        if not self.upload_clip:
            return

        files = []
        clip_path = meta.get("clip_path")
        if clip_path:
            files.append(clip_path)

        # Attach the robot's full logs (abr-testing get_logs) if we grabbed them.
        log_zip = meta.get("log_zip")
        if log_zip and os.path.exists(log_zip):
            files.append(log_zip)

        for path in files:
            if not os.path.exists(path):
                continue
            try:
                with open(path, "rb") as fc:
                    self.client.files_upload_v2(
                        file=fc,
                        filename=os.path.basename(path),
                        title=os.path.basename(path),
                        channel=self.channel_id,
                        thread_ts=thread_ts,
                    )
            except Exception as exc:  # noqa: BLE001
                log.warning("[%s] Slack upload of %s failed: %s", robot_name, path, exc)
        log.debug("[%s] Slack notification sent", robot_name)

        # Kick off Gemini video analysis in the background so it doesn't block
        # this robot's poll loop; it posts the result back into the thread.
        clip_path = meta.get("clip_path")
        if not self.gemini_api_key:
            log.info("[%s] skipping AI analysis: GEMINI_API_KEY not set", robot_name)
        elif not (clip_path and os.path.exists(clip_path)):
            log.info("[%s] skipping AI analysis: no clip on disk (%s)",
                     robot_name, clip_path)
        else:
            threading.Thread(
                target=self._post_analysis,
                args=(robot_name, clip_path, thread_ts),
                daemon=True,
            ).start()

    def _post_analysis(self, robot_name: str, clip_path: str, thread_ts: str) -> None:
        """Run Gemini analysis on the local clip and reply in-thread."""
        log.info("[%s] starting AI video analysis of %s",
                 robot_name, os.path.basename(clip_path))
        try:
            from ai_analysis import analyze_video

            analysis = analyze_video(clip_path, self.gemini_api_key)
        except Exception as exc:  # noqa: BLE001 - never let analysis break alerts
            log.warning("[%s] AI video analysis failed: %s", robot_name, exc)
            return
        if not analysis:
            log.info("[%s] AI analysis returned no content", robot_name)
            return
        try:
            self.client.chat_postMessage(
                channel=self.channel,
                thread_ts=thread_ts,
                text=f"*AI Video Analysis:*\n{analysis}",
            )
            log.info("[%s] posted AI video analysis", robot_name)
        except Exception as exc:  # noqa: BLE001
            log.warning("[%s] posting AI analysis failed: %s", robot_name, exc)


def _resolve_slack_token(n: NotifyConfig) -> str:
    """Resolve the shared Slack token from token_ini or token_file."""
    if n.token_ini:
        return _read_token_from_ini(n.token_ini)
    if n.token_file:
        return _read_token_file(n.token_file)
    raise SystemExit(
        "notify.type is 'slack' but neither notify.token_ini nor notify.token_file is set."
    )


def _read_token_from_ini(path: str) -> str:
    """Read the Slack bot token from an abr-style config.ini.

    Looks for [slack] token, then [DEFAULT] slack_token. Supports an indirect
    token_file = /path pointer too.
    """
    expanded = os.path.expanduser(path)
    if not os.path.exists(expanded):
        raise SystemExit(f"Slack key file '{path}' not found.")
    parser = configparser.ConfigParser()
    parser.read(expanded)

    def get(*keys: tuple[str, str]) -> str:
        for section, key in keys:
            if parser.has_option(section, key):
                return parser.get(section, key).strip()
        return ""

    token = get(("slack", "token"), ("DEFAULT", "slack_token"))
    token_file = get(("slack", "token_file"), ("DEFAULT", "slack_token_file"))
    if not token and token_file:
        token = _read_token_file(token_file)
    if not token:
        raise SystemExit(
            f"Slack key file '{path}' has no token. Expected "
            "'[DEFAULT] slack_token = xoxb-...' (or [slack] token / token_file)."
        )
    return token


def build_robot_notifier(robot: RobotConfig, cfg: Config):
    """Build this robot's notifier using the shared Slack key + per-robot channel."""
    n = cfg.notify
    if not n.enabled or n.type == "none":
        return None
    if n.type == "webhook":
        return WebhookNotifier(n)
    if n.type != "slack":
        log.warning("unknown notify.type '%s'; notifications disabled", n.type)
        return None

    # Shared token by default; per-robot config_ini overrides the key.
    token = _read_token_from_ini(robot.config_ini) if robot.config_ini else _resolve_slack_token(n)
    channel = robot.slack_channel or n.channel
    if not channel:
        raise SystemExit(
            f"[{robot.name}] has no Slack channel. Set 'slack_channel' on the robot "
            "or a default 'channel' under notify."
        )
    # Poster name defaults to the robot's own name; slack_username (per robot)
    # or notify.username (global) override it if set.
    username = robot.slack_username or n.username or robot.name
    gemini_api_key = os.environ.get("GEMINI_API_KEY", "")
    return SlackNotifier(token, channel, username, n.upload_clip, gemini_api_key)


# --------------------------------------------------------------------------- #
# Rolling recorder (ffmpeg)
# --------------------------------------------------------------------------- #
class Recorder:
    """Records the robot's HLS feed into a rolling buffer of .ts segments."""

    def __init__(self, robot: RobotConfig, work_dir: str, clip: ClipConfig):
        self.robot = robot
        self.clip = clip
        self.seg_dir = os.path.join(work_dir, robot.name)
        self.stream_url = f"http://{robot.ip}:31950/hls/stream.m3u8"
        self._proc: subprocess.Popen | None = None

    @property
    def running(self) -> bool:
        return self._proc is not None and self._proc.poll() is None

    def start(self) -> None:
        if self.running:
            return
        os.makedirs(self.seg_dir, exist_ok=True)
        seg_pattern = os.path.join(self.seg_dir, "seg_%07d.ts")
        cmd = [
            "ffmpeg",
            "-nostdin",
            "-loglevel", "warning",
            "-fflags", "+genpts",
            "-i", self.stream_url,
            "-c", "copy",
            "-f", "segment",
            "-segment_time", str(self.clip.segment_seconds),
            "-segment_format", "mpegts",
            "-strftime", "0",
            seg_pattern,
        ]
        log.debug("[%s] starting recorder -> %s", self.robot.name, self.stream_url)
        self._proc = subprocess.Popen(
            cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )

    def stop(self) -> None:
        if self._proc and self._proc.poll() is None:
            self._proc.terminate()
            try:
                self._proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self._proc.kill()
        self._proc = None

    def prune(self) -> None:
        """Delete segments older than the configured buffer window."""
        cutoff = time.time() - self.clip.buffer_seconds
        try:
            for name in os.listdir(self.seg_dir):
                if not name.endswith(".ts"):
                    continue
                path = os.path.join(self.seg_dir, name)
                try:
                    if os.path.getmtime(path) < cutoff:
                        os.remove(path)
                except FileNotFoundError:
                    pass
        except FileNotFoundError:
            pass

    def cleanup(self) -> None:
        shutil.rmtree(self.seg_dir, ignore_errors=True)

    def _segments_newest_last(self) -> list[str]:
        try:
            files = [
                os.path.join(self.seg_dir, n)
                for n in os.listdir(self.seg_dir)
                if n.endswith(".ts")
            ]
        except FileNotFoundError:
            return []
        files.sort(key=lambda p: os.path.getmtime(p))
        return files

    def extract_clip(self, output_dir: str, run_id: str, reason: str,
                     drop_active: bool = True, base_name: str | None = None) -> str | None:
        """Concatenate the most recent segments into a single mp4. Returns path.

        drop_active: when True (recorder still running) the newest, still-being-
        written segment is dropped to avoid a partial file. Pass False after the
        recorder has been stopped, so the final segment is included.
        base_name: filename stem for the clip (without extension). Defaults to
        "<robot>_<run>_<ts>".
        """
        segments = self._segments_newest_last()
        if not segments:
            log.warning("[%s] no recorded segments to clip", self.robot.name)
            return None

        if (drop_active and len(segments) > 1
                and (time.time() - os.path.getmtime(segments[-1])) < self.clip.segment_seconds):
            segments = segments[:-1]

        # Include pre-error footage plus the post-error tail we kept recording.
        window = self.clip.pre_error_seconds + self.clip.post_error_seconds
        wanted = math.ceil(window / self.clip.segment_seconds) + 1
        chosen = segments[-wanted:]

        os.makedirs(output_dir, exist_ok=True)
        base = base_name or f"{self.robot.name}_{run_id[:8]}_{utcstamp()}"
        clip_path = os.path.join(output_dir, base + ".mp4")

        # These .ts files come from a single continuous ffmpeg encode, so their
        # PTS are already monotonic across segment boundaries. The mpegts concat
        # *protocol* joins them as one byte stream and remuxes with intact
        # timestamps. (The concat *demuxer* + per-segment timestamp resets used
        # to produce overlapping PTS, which froze players mid-clip.)
        concat_input = "concat:" + "|".join(os.path.abspath(s) for s in chosen)

        cmd = [
            "ffmpeg",
            "-nostdin",
            "-loglevel", "error",
            "-y",
            "-fflags", "+genpts",
            "-i", concat_input,
            "-c", "copy",
            "-avoid_negative_ts", "make_zero",
            "-movflags", "+faststart",
            clip_path,
        ]
        try:
            subprocess.run(cmd, check=True, timeout=120)
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as exc:
            log.error("[%s] clip extraction failed: %s", self.robot.name, exc)
            return None

        log.debug("[%s] saved clip %s (%d segments, reason=%s)",
                  self.robot.name, clip_path, len(chosen), reason)
        return clip_path


def prune_old_clips(output_dir: str, keep: int) -> None:
    """Keep only the `keep` most recent incident folders in output_dir.

    Each error gets its own subfolder (clip + logs zip), so this caps the total
    number of incident folders kept (shared across all robots) and deletes the
    oldest ones wholesale. Loose files in output_dir (e.g. robot_key, get_logs
    scratch) are left untouched.
    """
    if keep <= 0:
        return
    try:
        dirs = [
            os.path.join(output_dir, n)
            for n in os.listdir(output_dir)
            if os.path.isdir(os.path.join(output_dir, n))
        ]
    except FileNotFoundError:
        return
    dirs.sort(key=lambda p: os.path.getmtime(p), reverse=True)
    for path in dirs[keep:]:
        shutil.rmtree(path, ignore_errors=True)
        log.debug("pruned old incident folder %s", path)


def fetch_robot_logs(ip: str, storage_dir: str, dest_dir: str | None = None) -> str | None:
    """Download a robot's logs via abr-testing's get_logs; return the .zip path.

    Loads read_robot_logs.py from READ_ROBOT_LOGS_PATH (its package root is added
    to sys.path so its `abr_testing.*` imports resolve). get_logs reads its SSH
    key from "{storage_dir}/robot_key" and writes there, so storage_dir stays
    stable. If dest_dir is given, the finished zip is moved into it (e.g. the
    per-incident folder). Returns None on any failure so a logging hiccup never
    blocks the clip/notification.
    """
    try:
        zip_path = get_logs(Path(storage_dir), ip)
        if zip_path and dest_dir:
            os.makedirs(dest_dir, exist_ok=True)
            moved = os.path.join(dest_dir, os.path.basename(zip_path))
            shutil.move(zip_path, moved)
            return moved
        return zip_path
    except Exception as exc:  # noqa: BLE001 - never let log collection break alerts
        log.warning("log collection failed for %s: %s", ip, exc)
        return None


# --------------------------------------------------------------------------- #
# Per-run trigger bookkeeping
# --------------------------------------------------------------------------- #
@dataclass
class RunState:
    run_id: str
    reported_error_ids: set[str] = field(default_factory=set)
    recovery_reported: bool = False
    failed_reported: bool = False
    in_recovery: bool = False  # previous poll saw awaiting-recovery
    last_clip_ts: float = 0.0
    finished: bool = False  # clip captured OR run ended; stop recording it

# --------------------------------------------------------------------------- #
# Robot HTTP client
# --------------------------------------------------------------------------- #
class RobotClient:
    """Thin wrapper around the robot HTTP API (port 31950)."""

    def __init__(self, robot: RobotConfig, opentrons_version: str) -> None:
        self.robot = robot
        self.base_url = f"http://{robot.ip}:31950"
        self.session = requests.Session()
        self.session.headers.update({"Opentrons-Version": opentrons_version})

    def get_current_run(self) -> dict | None:
        resp = self.session.get(f"{self.base_url}/runs", timeout=8)
        resp.raise_for_status()
        data = resp.json().get("data", []) or []
        for run in data:
            if run.get("current"):
                return run
        return None

    def get_protocol_name(self, protocol_id: str | None) -> str:
        if not protocol_id:
            return "Unknown / No Protocol"
        try:
            resp = self.session.get(
                f"{self.base_url}/protocols/{protocol_id}", timeout=5
            )
            resp.raise_for_status()
            data = resp.json().get("data", {})

            metadata = data.get("metadata", {})
            name = metadata.get("protocolName") or metadata.get("protocol-name")

            if not name:
                files = data.get("files", [])
                if files:
                    name = files[0].get("name")

            return name or protocol_id
        except Exception as exc:
            log.warning(
                "[%s] failed to fetch protocol name for %s: %s",
                self.robot.name,
                protocol_id,
                exc,
            )
            return protocol_id

    def event_meta(
        self,
        run: dict,
        reason: str,
        *,
        protocol_name: str | None = None,
        detail: str | None = None,
        clip_path: str | None = None,
    ) -> dict:
        if protocol_name is None:
            protocol_name = self.get_protocol_name(run.get("protocolId"))
        return {
            "robot": self.robot.name,
            "robot_ip": self.robot.ip,
            "run_id": run.get("id", "unknown"),
            "reason": reason,
            "status": run.get("status"),
            "protocol_name": protocol_name,
            "error_detail": detail,
            "clip_path": clip_path,
        }


# --------------------------------------------------------------------------- #
# Incident handling (clip + logs + notify)
# --------------------------------------------------------------------------- #
class IncidentHandler:
    """Extract clips and notify when a run incident occurs."""

    def __init__(
        self,
        robot: RobotConfig,
        cfg: Config,
        recorder: Recorder,
        notifier,
        stop_event: threading.Event,
    ) -> None:
        self.robot = robot
        self.cfg = cfg
        self.recorder = recorder
        self.notifier = notifier
        self.stop_event = stop_event

    def save_and_notify(self, run: dict, reason: str, detail: str | None) -> None:
        run_id = run.get("id", "unknown")
        log.info(
            "[%s] %s on run %s (status=%s)%s",
            self.robot.name,
            reason,
            run_id[:8],
            run.get("status"),
            f": {detail}" if detail else "",
        )

        post = max(0, self.cfg.clip.post_error_seconds)
        if post:
            self.stop_event.wait(post)
        self.recorder.stop()

        incident = f"{self.robot.name}_{run_id[:8]}_{utcstamp()}"
        incident_dir = os.path.join(self.cfg.output_dir, incident)
        os.makedirs(incident_dir, exist_ok=True)

        clip_path = self.recorder.extract_clip(
            incident_dir, run_id, reason, drop_active=False, base_name=incident
        )
        self.recorder.cleanup()

        meta = {
            "robot": self.robot.name,
            "robot_ip": self.robot.ip,
            "run_id": run_id,
            "reason": reason,
            "status": run.get("status"),
            "error_detail": detail,
            "errors": run.get("errors") or [],
            "detected_at": datetime.now(timezone.utc).isoformat(),
            "clip_path": os.path.abspath(clip_path) if clip_path else None,
        }

        log_zip = fetch_robot_logs(
            self.robot.ip, self.cfg.output_dir, dest_dir=incident_dir
        )
        if log_zip:
            meta["log_zip"] = log_zip
            log.info(
                "[%s] collected robot logs: %s",
                self.robot.name,
                os.path.basename(log_zip),
            )

        try:
            if not os.listdir(incident_dir):
                os.rmdir(incident_dir)
        except OSError:
            pass

        prune_old_clips(self.cfg.output_dir, self.cfg.clip.max_clips)

        if self.notifier is not None:
            self.notifier.notify(self.robot.name, meta)


# --------------------------------------------------------------------------- #
# Trigger evaluation
# --------------------------------------------------------------------------- #
class TriggerEvaluator:
    """Decide when a run error warrants a clip and notification."""

    def __init__(
        self,
        cfg: Config,
        client: RobotClient,
        incidents: IncidentHandler,
        notifier,
    ) -> None:
        self.cfg = cfg
        self.client = client
        self.incidents = incidents
        self.notifier = notifier

    def evaluate(self, run: dict, state: RunState) -> None:
        if state.finished:
            return

        status = run.get("status", "")
        errors = run.get("errors") or []
        now = time.time()

        if now - state.last_clip_ts < self.cfg.clip.cooldown_seconds:
            return

        reason = None
        detail = None

        if self.cfg.triggers.on_command_error:
            new_errors = [
                e for e in errors if e.get("id") not in state.reported_error_ids
            ]
            if new_errors:
                reason = "command_error"
                detail = new_errors[0].get("detail") or new_errors[0].get("errorType")

        if reason is None and self.cfg.triggers.on_error_recovery:
            in_recovery = status in ERROR_STATUSES
            if in_recovery and not state.recovery_reported:
                reason = "error_recovery"

        if reason is None and self.cfg.triggers.on_failed:
            if status == "failed" and not state.failed_reported:
                reason = "run_failed"
                if errors:
                    detail = errors[0].get("detail") or errors[0].get("errorType")

        if reason is None:
            return

        if reason == "error_recovery" and self.notifier is not None:
            instant_meta = self.client.event_meta(
                run, "error_recovery_instant", detail=detail
            )
            self.notifier.notify(self.client.robot.name, instant_meta)

        state.reported_error_ids.update(e.get("id") for e in errors if e.get("id"))

        if status in ERROR_STATUSES:
            state.recovery_reported = True

        state.failed_reported = True
        state.last_clip_ts = now

        self.incidents.save_and_notify(run, reason, detail)


# --------------------------------------------------------------------------- #
# Recorder supervision (stream health + backoff)
# --------------------------------------------------------------------------- #
class RecorderSupervisor:
    """Start/restart the recorder and track HLS stream health."""

    def __init__(self, robot_name: str, recorder: Recorder) -> None:
        self.robot_name = robot_name
        self.recorder = recorder
        self.stream_ok = True
        self._recorder_fails = 0
        self._recorder_start_ts = 0.0
        self._recorder_counted = True
        self._recorder_retry_at = 0.0

    def ensure_recording(self) -> None:
        now = time.monotonic()
        if self.recorder.running:
            if now - self._recorder_start_ts > 3.0:
                if not self.stream_ok:
                    log.info("[%s] video recording resumed", self.robot_name)
                    self.stream_ok = True
                self._recorder_fails = 0
                self._recorder_counted = True
            return

        if not self._recorder_counted:
            self._recorder_fails += 1
            self._recorder_counted = True
            if self._recorder_fails == STREAM_DOWN_AFTER_FAILURES and self.stream_ok:
                log.warning(
                    "[%s] video stream unavailable (ffmpeg keeps exiting); "
                    "retrying every %.0fs",
                    self.robot_name,
                    STREAM_RETRY_BACKOFF,
                )
                self.stream_ok = False

        if now < self._recorder_retry_at:
            return

        self.recorder.start()
        self._recorder_start_ts = now
        self._recorder_counted = False
        self._recorder_retry_at = now + (
            STREAM_RETRY_BACKOFF
            if self._recorder_fails >= STREAM_DOWN_AFTER_FAILURES
            else 0.0
        )

    def reset_health(self) -> None:
        self.stream_ok = True
        self._recorder_fails = 0
        self._recorder_start_ts = 0.0
        self._recorder_counted = True
        self._recorder_retry_at = 0.0


# --------------------------------------------------------------------------- #
# Run lifecycle
# --------------------------------------------------------------------------- #
class RunLifecycle:
    """Track the current run and drive recording + trigger evaluation."""

    def __init__(
        self,
        robot: RobotConfig,
        client: RobotClient,
        evaluator: TriggerEvaluator,
        recorder: Recorder,
        supervisor: RecorderSupervisor,
        notifier,
    ) -> None:
        self.robot = robot
        self.client = client
        self.evaluator = evaluator
        self.recorder = recorder
        self.supervisor = supervisor
        self.notifier = notifier
        self.run_state: RunState | None = None
        self.recording_paused = False

    def handle_run(self, run: dict | None, *, first_poll_done: bool) -> None:
        if run is None:
            if self.run_state is not None:
                log.debug("[%s] run ended/cleared", self.robot.name)
                self.recorder.stop()
                self.recorder.cleanup()
                self.run_state = None
            return

        run_id = run.get("id", "")
        status = run.get("status", "")

        is_new_run = self.run_state is None or self.run_state.run_id != run_id
        if status != "idle" and is_new_run:
            self.recorder.stop()
            self.recorder.cleanup()
            self.supervisor.reset_health()

            is_startup = not first_poll_done
            existing_errors = {e.get("id") for e in run.get("errors", []) if e.get("id")}
            is_recovering = status in ERROR_STATUSES
            is_failed = status == "failed"

            self.run_state = RunState(
                run_id=run_id,
                reported_error_ids=existing_errors if is_startup else set(),
                recovery_reported=is_recovering if is_startup else False,
                in_recovery=is_recovering,
                failed_reported=is_failed if is_startup else False,
            )

            log.info(
                "[%s] monitoring run %s (status=%s)",
                self.robot.name,
                run_id[:8],
                status,
            )

            if self.notifier is not None and not is_startup:
                start_meta = self.client.event_meta(run, "run_started")
                self.notifier.notify(self.robot.name, start_meta)

        if self.run_state is None:
            return

        if self.run_state.finished:
            return

        if status in TERMINAL_STATUSES:
            self.evaluator.evaluate(run, self.run_state)

            if status == "succeeded" and self.notifier is not None and first_poll_done:
                finish_meta = self.client.event_meta(run, "run_finished")
                self.notifier.notify(self.robot.name, finish_meta)

            self.recorder.stop()
            self.recorder.cleanup()
            self.run_state.finished = True
            return

        if status in ACTIVE_STATUSES:
            in_recovery = status in ERROR_STATUSES
            if in_recovery:
                self.recording_paused = True
                if self.run_state.recovery_reported:
                    self.recorder.stop()
                self.run_state.in_recovery = True
            else:
                if self.run_state.in_recovery:
                    self.run_state.failed_reported = False
                self.recording_paused = False
                self.supervisor.ensure_recording()
                self.recorder.prune()
                if self.run_state.recovery_reported:
                    self.run_state.recovery_reported = False
                self.run_state.in_recovery = False
            self.evaluator.evaluate(run, self.run_state)


# --------------------------------------------------------------------------- #
# Robot watcher (poll loop)
# --------------------------------------------------------------------------- #
class RobotWatcher(threading.Thread):
    """Poll one robot, record video, and react to run errors."""

    def __init__(
        self,
        robot: RobotConfig,
        cfg: Config,
        stop_event: threading.Event,
        notifier=None,
    ) -> None:
        super().__init__(name=f"watch-{robot.name}", daemon=True)
        self.robot = robot
        self.cfg = cfg
        self.stop_event = stop_event
        self.notifier = notifier

        self.recorder = Recorder(robot, cfg.work_dir, cfg.clip)
        self.client = RobotClient(robot, cfg.opentrons_version)
        self.incidents = IncidentHandler(robot, cfg, self.recorder, notifier, stop_event)
        self.evaluator = TriggerEvaluator(cfg, self.client, self.incidents, notifier)
        self.supervisor = RecorderSupervisor(robot.name, self.recorder)
        self.lifecycle = RunLifecycle(
            robot, self.client, self.evaluator, self.recorder, self.supervisor, notifier
        )

        self.reachable = True
        self._first_poll_done = False

    def run(self) -> None:
        backoff = self.cfg.poll_interval_seconds
        while not self.stop_event.is_set():
            try:
                run = self.client.get_current_run()
                if not self.reachable:
                    log.info("[%s] reachable again", self.robot.name)
                    self.reachable = True
                self.lifecycle.handle_run(run, first_poll_done=self._first_poll_done)
                if not self._first_poll_done:
                    self._first_poll_done = True
                backoff = self.cfg.poll_interval_seconds
            except requests.RequestException as exc:
                if self.reachable:
                    log.warning("[%s] unreachable: %s", self.robot.name, exc)
                    self.reachable = False
                backoff = min(backoff * 1.5, 30.0)
            except Exception:  # noqa: BLE001 - never let one robot kill the loop
                log.exception("[%s] unexpected error", self.robot.name)
                backoff = min(backoff * 1.5, 30.0)

            state = self.lifecycle.run_state
            if (
                state is not None
                and not state.finished
                and not self.lifecycle.recording_paused
            ):
                try:
                    self.supervisor.ensure_recording()
                except Exception:  # noqa: BLE001
                    log.exception("[%s] recorder restart failed", self.robot.name)

            self.stop_event.wait(backoff)

        self.recorder.stop()
        self.recorder.cleanup()


# --------------------------------------------------------------------------- #
# Entry point
# --------------------------------------------------------------------------- #
def main() -> None:
    parser = argparse.ArgumentParser(description="Opentrons run monitor + error clip recorder")
    # Add the new storage directory argument
    parser.add_argument("--storage-directory", required=True, help="Base directory for configs, clips, and recordings")
    # Make config default to just the filename, since we will append it to storage-directory
    parser.add_argument("--config", default="config.yaml", help="Name or path of YAML config")
    parser.add_argument("--verbose", action="store_true", help="Debug logging")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )
    logging.getLogger("slack_sdk").setLevel(logging.WARNING)

    if shutil.which("ffmpeg") is None:
        raise SystemExit("ffmpeg not found on PATH. Install it (e.g. `sudo apt install ffmpeg`).")

    # Resolve the storage directory and config path
    storage_dir = Path(args.storage_directory).expanduser().resolve()
    
    # If the user passes an absolute path for --config, this will use that absolute path.
    # Otherwise, it looks for config.yaml inside the storage_directory.
    config_path = storage_dir / args.config

    if not config_path.exists():
         raise SystemExit(f"Configuration file not found: {config_path}")

    # Pass the storage_dir to load_config so it can resolve interior paths
    cfg = load_config(str(config_path), storage_dir)
    
    os.makedirs(cfg.output_dir, exist_ok=True)
    os.makedirs(cfg.work_dir, exist_ok=True)

    stop_event = threading.Event()

    def _shutdown(signum, _frame):
        log.info("signal %s received, shutting down…", signum)
        stop_event.set()

    signal.signal(signal.SIGINT, _shutdown)
    signal.signal(signal.SIGTERM, _shutdown)

    watchers = [
        RobotWatcher(r, cfg, stop_event, build_robot_notifier(r, cfg))
        for r in cfg.robots
    ]
    for w in watchers:
        w.start()
    log.info("monitoring %d robot(s); press Ctrl-C to stop", len(watchers))

    while not stop_event.is_set():
        stop_event.wait(1.0)

    for w in watchers:
        w.join(timeout=10)
    log.info("stopped")


if __name__ == "__main__":
    main()
