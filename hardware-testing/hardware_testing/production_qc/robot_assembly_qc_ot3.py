"""Robot assembly QC OT3."""
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVSection,
    CSVLine
)

REPORT = CSVReport(
    script_path=__file__,
    sections=[
        CSVSection(
            title="GANTRY-SPEED-ACCELERATION",
            lines=[
                CSVLine("axis-currents", [float, float, float, float]),
                CSVLine("home-mot", [float, float, float, float]),
                CSVLine("home-enc", [float, float, float, float, CSVResult]),
                CSVLine("x-min-mot", [float, float, float, float]),
                CSVLine("x-min-enc", [float, float, float, float, CSVResult]),
                CSVLine("x-max-mot", [float, float, float, float]),
                CSVLine("x-max-enc", [float, float, float, float, CSVResult]),
                CSVLine("y-min-mot", [float, float, float, float]),
                CSVLine("y-min-enc", [float, float, float, float, CSVResult]),
                CSVLine("y-max-mot", [float, float, float, float]),
                CSVLine("y-max-enc", [float, float, float, float, CSVResult]),
                CSVLine("zl-min-mot", [float, float, float, float]),
                CSVLine("zl-min-enc", [float, float, float, float, CSVResult]),
                CSVLine("zl-max-mot", [float, float, float, float]),
                CSVLine("zl-max-enc", [float, float, float, float, CSVResult]),
                CSVLine("zr-min-mot", [float, float, float, float]),
                CSVLine("zr-min-enc", [float, float, float, float, CSVResult]),
                CSVLine("zr-max-mot", [float, float, float, float]),
                CSVLine("zr-max-enc", [float, float, float, float, CSVResult])
            ]
        ),
        CSVSection(
            title="SYSTEM-SIGNALS",
            lines=[
                CSVLine("nsync-target-pos", [float, float, float]),
                CSVLine("nsync-stop-pos", [float, float, float, CSVResult]),
                CSVLine("estop-target-pos", [float, float, float]),
                CSVLine("estop-stop-pos", [float, float, float, CSVResult]),
            ]
        ),
        CSVSection(
            title="INSTRUMENTS",
            lines=[
                CSVLine("left-id", [str, str, CSVResult]),
                CSVLine("left-enc-max", [float, CSVResult]),
                CSVLine("left-enc-home", [float, CSVResult]),
                CSVLine("left-probe-distance", [float, CSVResult]),
                CSVLine("right-id", [str, str, CSVResult]),
                CSVLine("right-enc-max", [float, CSVResult]),
                CSVLine("right-enc-home", [float, CSVResult]),
                CSVLine("right-probe-distance", [float, CSVResult]),
                CSVLine("gripper-id", [str, str, CSVResult]),
                CSVLine("gripper-z-max-travel", [float, CSVResult]),
                CSVLine("gripper-jaw-enc-grip", [float, CSVResult]),
                CSVLine("gripper-jaw-enc-ungrip", [float, CSVResult]),
                CSVLine("gripper-probe-distance-front", [float, CSVResult]),
                CSVLine("gripper-probe-distance-rear", [float, CSVResult])
            ]
        ),
        CSVSection(
            title="CONNECTIVITY",
            lines=[
                CSVLine("ethernet", [str, CSVResult]),
                CSVLine("wifi", [str, str, str, CSVResult]),
                CSVLine("usb-b-rear", [CSVResult]),
                CSVLine("usb-a-front", [CSVResult]),
                CSVLine("usb-a-right-1", [CSVResult]),
                CSVLine("usb-a-right-2", [CSVResult]),
                CSVLine("usb-a-right-3", [CSVResult]),
                CSVLine("usb-a-right-4", [CSVResult]),
                CSVLine("usb-a-left-1", [CSVResult]),
                CSVLine("usb-a-left-2", [CSVResult]),
                CSVLine("usb-a-left-3", [CSVResult]),
                CSVLine("usb-a-left-4", [CSVResult]),
                CSVLine("aus-left-can", [CSVResult]),
                CSVLine("aus-left-estop", [CSVResult]),
                CSVLine("aus-left-door-switch", [CSVResult]),
                CSVLine("aus-right-can", [CSVResult]),
                CSVLine("aus-right-estop", [CSVResult]),
                CSVLine("aus-right-door-switch", [CSVResult])
            ]
        ),
        CSVSection(
            title="PERIPHERALS",
            lines=[
                CSVLine("screen-on", [CSVResult]),
                CSVLine("screen-touch", [CSVResult]),
                CSVLine("deck-lights-on", [CSVResult]),
                CSVLine("deck-lights-off", [CSVResult]),
                CSVLine("status-lights-on", [CSVResult]),
                CSVLine("door-switch", [CSVResult]),
                CSVLine("camera-active", [CSVResult]),
                CSVLine("camera-image", [CSVResult])
            ]
        )
    ]
)

if __name__ == "__main__":
    robot_id = input("Type (scan) the robot serial number: ")
    REPORT.set_tag(robot_id)
