"""Model of a protocol for testing."""

from pathlib import Path
from typing import Any, Optional

from pydantic import Field

from automation.data.protocol import GENERATED_PROTOCOLS_FOLDER, OVERRIDE_MONIKER, Protocol


class ProtocolWithOverrides(Protocol):
    """Model to describe a protocol that uses a base protocol to generate multiple Protocol classes"""

    overrides: list[str] = Field(description="A list of test options to iterate on, suitable to concatenate in a filename")
    protocols: Optional[list[Protocol]] = Field(description="A list of the generated protocols", default=None)

    def __init__(self, **data: Any) -> None:
        super().__init__(**data)
        self.create_protocols()

    def create_protocols(self) -> None:
        with open(self.file_path, "r") as file:
            original_content = file.read()
        protocols: list[Protocol] = []
        for override in self.overrides:
            # Create the new file name with the override appended before the extension
            new_file_stem: str = f"{self.file_stem}{OVERRIDE_MONIKER}{override}"
            new_file_name = f"{new_file_stem}.{self.file_extension}"
            # Create the full path for the new file
            # all generated files live at files/protocols/$GENERATED_PROTOCOLS_FOLDER
            new_file_path = Path(self.file_path.parent, GENERATED_PROTOCOLS_FOLDER, new_file_name)
            # Prepare the override string to prepend
            override_string = f'{self.override_variable_name} = "{override}"\n'
            # Write the new file with the override string prepended
            with open(new_file_path, "w") as new_file:
                new_file.write(override_string + original_content)

            protocol = Protocol(
                file_stem=new_file_stem,
                file_extension=self.file_extension,
                robot=self.robot,
                app_error=self.app_error,
                robot_error=self.robot_error,
                app_analysis_error=self.app_analysis_error,
                robot_analysis_error=self.robot_analysis_error,
                custom_labware=self.custom_labware,
                instruments=self.instruments,
                modules=self.modules,
                description=self.description,
                expected_test_failure=self.expected_test_failure,
                expected_test_reason=self.expected_test_reason,
                from_override=True,
                override_value=override,
            )
            protocols.append(protocol)
        self.protocols = protocols
