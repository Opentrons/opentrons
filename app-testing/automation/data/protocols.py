"""Map for protocol files available for testing."""
from automation.data.protocol import Protocol


class Protocols:
    """Describe protocols available for testing."""

    # The name of the property must match the file_name property
    # and be in protocol_files.names
    upload_protocol: Protocol = Protocol(
        file_name="upload_protocol",
        file_extension="json",
        protocol_name="script_pur_sample_1",
        robot="OT-2",
        app_error=False,
        robot_error=False,
    )

    badimport: Protocol = Protocol(
        file_name="badimport",
        file_extension="py",
        protocol_name="bad import",
        robot="OT-2",
        app_error=True,
        robot_error=True,
        app_analysis_error="No module named 'superspecialmagic'",
        robot_analysis_error="?",
    )
