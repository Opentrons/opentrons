"""Gemini AI analysis of robot error videos.

This module is dependency-isolated on purpose: it imports only google-genai and
the standard library. It runs OFF the robot inside the Slack analyzer service
(see slack_error_analyzer_api.py), so google-genai and its heavy transitive
dependencies (pydantic, anyio, httpx, ...) never touch the robot-server
environment.
"""
import os
import textwrap
import time

from google import genai
from google.genai import types


def analyze_video(video_path: str, api_key: str) -> str | None:
    """Upload a video to Gemini and return a structured error analysis."""
    client = genai.Client(api_key=api_key)
    video_file = client.files.upload(file=video_path)

    while video_file.state == types.FileState.PROCESSING:
        time.sleep(2)
        video_file = client.files.get(name=video_file.name)

    if video_file.state != types.FileState.ACTIVE:
        raise RuntimeError(
            f"Video file failed to process: state={video_file.state}, "
            f"error={getattr(video_file, 'error', None)}"
        )

    system_prompt = textwrap.dedent("""
        Purpose
        You are an expert AI Video Analyst specializing in laboratory automation and
        robotic liquid handling systems. Your objective is to review top-down video
        clips of an automated liquid handling deck, identify the operational error or
        run abortion, and briefly describe what went wrong.

        Deck Layout Reference
        The deck is a 4x3 grid of 12 slots. Rows are named with letters A-D and
        columns are named with numbers 1-3, so every slot has a coordinate of the
        form <letter><number>, ranging from A1 to D3 (A1, A2, A3, B1, B2, B3, C1,
        C2, C3, D1, D2, D3). Row A is at the back of the deck (farthest from the
        operator), row D is at the front (nearest the operator); column 1 is on the
        left and column 3 is on the right. Because the video is top-down, use this
        coordinate system to locate deck elements. Always refer to a location by its
        specific slot coordinate (e.g., "slot A1", "slot D3") instead of vague
        directions like "top right" or "the left side".

        Output Format
        Respond with exactly two short parts and nothing else:

        **Error:** 2-3 sentences describing what went wrong. Name the error, the
        deck elements involved (e.g., tip racks, well plates, troughs) and their
        specific slot coordinate, and the robot's relevant behavior.

        **Suggested Fix:** 1-2 sentences suggesting how to resolve the underlying
        issue so normal automated operation can resume.

        Guidelines
        Objective & Technical: Use precise laboratory and robotics terminology
        (e.g., robotic gantry, deck slot coordinates like A1-D3, pipetting head,
        optical/physical error boundary, flush and locked).

        Concise: Keep the total response to a few sentences. Do not describe human
        intervention, do not add extra sections, and avoid dense blocks of text.

        No Speculation: Base your analysis strictly on the visual evidence in the
        video clip, focusing on spatial orientation, alignment, and physical
        interactions.

        Example Reference (Few-Shot Grounding)
        **Error:** Tip Rack Misalignment. The robot's gantry moved toward the purple
        pipette tip rack in slot B1, detected a spacing/alignment issue (or reached an
        optical/physical error boundary), and returned to its resting position because
        the tip box was not properly seated in its deck slot.

        **Suggested Fix:** Re-seat the tip box in slot B1 so it sits flush and locked
        in its deck slot, allowing the pipetting head to align accurately with the
        tips.
        """).strip()

    user_prompt = textwrap.dedent("""
        Analyze the attached top-down video clip of the automated liquid handling
        deck. Identify the point where the protocol run stalls, aborts, or otherwise
        deviates from normal automated operation.

        Respond with the "Error" and "Suggested Fix" parts exactly as defined in the
        system instructions: 2-3 sentences on what went wrong followed by a brief
        suggested fix. Keep it concise and do not add any other sections.
        """).strip()

    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=[
            video_file,
            user_prompt,
        ],
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.2,
        ),
    )

    return response.text


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print(
            "usage: python -m abr_testing.automation.ai_analysis <video_path>",
            file=sys.stderr,
        )
        sys.exit(2)
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        print("GEMINI_API_KEY environment variable is not set", file=sys.stderr)
        sys.exit(2)
    result = analyze_video(sys.argv[1], key)
    if not result:
        print("No analysis returned", file=sys.stderr)
        sys.exit(1)
    print(result)