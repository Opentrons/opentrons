import shutil
import subprocess
from pathlib import Path

from playwright.sync_api import Page

from automation.helpers.artifacts import ARTIFACTS_DIR


class ScrollVideoHelper:
    """Capture a slow scroll as an mp4 for quick visual review."""

    def __init__(self, page: Page, output_dir: Path = ARTIFACTS_DIR):
        """Bind a Playwright page and optional output directory."""
        self.page = page
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def record(
        self,
        section: str,
        name: str,
        *,
        heading_name: str = "Labware",
        wheel_px: int = 400,
        pause_ms: int = 150,
        max_steps: int = 40,
    ) -> Path:
        """Scroll the page slowly while capturing frames, then encode an mp4."""
        frames_dir = self.output_dir / section / f"{name}_frames"
        frames_dir.mkdir(parents=True, exist_ok=True)

        heading = self.page.get_by_role("heading", name=heading_name, level=1)
        heading.scroll_into_view_if_needed()
        box = heading.bounding_box()
        if box is not None:
            self.page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)

        for step in range(max_steps):
            frame_path = frames_dir / f"frame_{step:04d}.png"
            self.page.screenshot(path=str(frame_path))
            self.page.mouse.wheel(0, wheel_px)
            self.page.wait_for_timeout(pause_ms)

        video_path = self.output_dir / section / f"{name}.mp4"
        if self._encode_video(frames_dir, video_path):
            shutil.rmtree(frames_dir)
            return video_path
        return frames_dir

    @staticmethod
    def _encode_video(frames_dir: Path, video_path: Path) -> bool:
        """Encode numbered PNG frames into an mp4 using ffmpeg."""
        video_path.parent.mkdir(parents=True, exist_ok=True)
        try:
            subprocess.run(
                [
                    "ffmpeg",
                    "-y",
                    "-framerate",
                    "5",
                    "-i",
                    str(frames_dir / "frame_%04d.png"),
                    "-pix_fmt",
                    "yuv420p",
                    str(video_path),
                ],
                check=True,
                capture_output=True,
            )
            return True
        except (FileNotFoundError, subprocess.CalledProcessError):
            return False
