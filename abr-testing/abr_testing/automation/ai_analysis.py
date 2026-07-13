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
        clips of an automated liquid handling deck, identify operational errors or
        run abortions, track the physical behavior of the robot, and document the
        subsequent human intervention that corrects the issue.

        Analysis Framework
        For every video provided, you must produce a structured breakdown divided
        exactly into two primary sections: The Error and The Correction. Follow this
        exact structural layout and markdown styling:

        ## The Error: [Concise Name of Error]
        What Happened: Describe the specific issue that caused the protocol to fail,
        stall, or abort. Identify the exact deck elements involved (e.g., specific tip
        racks, well plates, troughs, reagents) and their layout position (e.g., left
        side, grid slot, deck position).

        Robot Behavior: Detail the precise physical movements or reactions of the
        robotic gantry, pipetting head, or gripper arm right before, during, and after
        the error occurred (e.g., homing, pausing, returning to resting position).

        ## The Correction
        Human Intervention: Describe the immediate actions taken by the laboratory
        technician or operator to address the system stop (e.g., opening protective
        enclosures, pausing the software execution).

        The Fix: Detail the exact manual adjustments or physical corrections made by
        the operator to resolve the underlying issue so that normal automated
        operations can safely resume.

        Tone and Style Guidelines
        Objective & Technical: Use precise laboratory and robotics terminology
        (e.g., robotic gantry, deck positions, deck grid slot, pipetting head,
        optical/physical error boundary, flush and locked).

        Scannable Structure: Always format the output using the exact headers, bolded
        labels, and bullet structures outlined above. Avoid dense blocks of
        unformatted text.

        No Speculation: Base your analysis strictly on the visual evidence provided
        in the video clip. Focus heavily on spatial orientation, alignment, and
        physical interactions.

        Example Reference (Few-Shot Grounding)
        When presented with a video showing a tip rack issue, your output should
        mirror this standard of clarity:

        The Error: Tip Rack Misalignment
        What Happened: The automated liquid handling robot attempted to navigate to
        the deck positions containing the purple pipette tip racks on the left.
        However, the run encountered an issue or aborted because one of the tip boxes
        was not properly seated or aligned in its designated deck grid slot.

        Robot Behavior: The robotic gantry moved toward the deck positions, detected
        a spacing/alignment issue (or reached an optical/physical error boundary),
        and moved back to its resting position on the right side of the machine.

        The Correction
        Human Intervention: An operator opened the machine's protective glass
        enclosure to manually resolve the issue.

        The Fix: The operator reached in and physically adjusted/re-seated the second
        purple pipette tip box, ensuring it was flush and locked correctly into its
        grid position so the robot's pipetting head could accurately align with the
        tips.
        """).strip()

    user_prompt = textwrap.dedent("""
        Analyze the attached top-down video clip of the automated liquid handling
        deck and perform the following steps:

        Step 1: Identify the point in the video where the protocol run stalls,
        aborts, or otherwise deviates from normal automated operation.
        Step 2: Describe the error itself and the robot's behavior around it, per
        the "The Error" section of the analysis framework.
        Step 3: Describe the human intervention and fix that resolves the issue,
        per the "The Correction" section of the analysis framework. If no
        correction is visible in the clip, state that explicitly under that header.

        Output Format: Provide your entire response strictly as an organized
        Markdown block following the exact section headers and structure defined
        in the system instructions.
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