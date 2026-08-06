"""Model of a protocol for testing."""

import hashlib
from pathlib import Path
from typing import Any, Dict, Literal, Optional

from pydantic import BaseModel, Field

# Directory configs
PROTOCOLS_FOLDER = Path(__file__).parent.parent.parent / "files" / "protocols"
MANUAL_PROTOCOL_LIBRARY_PROTOCOLS_FOLDER = PROTOCOLS_FOLDER / "manual_protocol_library"
PROTOCOL_DESIGNER_PROTOCOLS_FOLDER = PROTOCOLS_FOLDER / "protocol_designer"
PROTOCOL_LIBRARY_PROTOCOLS_FOLDER = PROTOCOLS_FOLDER / "protocol_library"
GENERATORS_FOLDER = PROTOCOLS_FOLDER / "generators"
GENERATED_PROTOCOLS_FOLDER = PROTOCOLS_FOLDER / "generated_protocols"
LABWARE_FOLDER = Path(__file__).parent.parent.parent / "files" / "labware"

OVERRIDE_IDENTIFIER = "_Override_"
PL_IDENTIFIER = "_PL_"
MANUAL_PL_IDENTIFIER = "_MPL_"


class Protocol(BaseModel):
    """Model to describe a protocol used in a test."""

    file_stem: str = Field(description="file name not including extension")
    folder: Path = Field(
        description="folder where the protocol is stored",
    )
    file_extension: Literal["json", "py"] = Field(description="file extension of the protocol")
    robot: Literal["Flex"] = Field(description="the robot type which will appear in the robot field in the app")
    override_variable_name: Optional[str] = Field(description="The variable name to override", default=None)
    override_value: Optional[str] = Field(description="The value of the override", default=None)
    from_override: bool = Field(description="Is this protocol generated from an override", default=False)

    @property
    def file_path(self) -> Path:
        """Path of the file."""
        return Path(
            self.folder,
            f"{self.file_stem}.{self.file_extension}",
        )

    @property
    def short_sha(self) -> str:
        """Short sha of the file."""
        # Hash the string using SHA-1
        hash_object = hashlib.sha1(self.file_stem.encode())
        # Convert to hexadecimal and truncate
        return hash_object.hexdigest()[:10]

    def to_json(self) -> str:
        """Serialize this Protocol instance to a JSON string.

        Returns:
            A JSON string representing this Protocol.
        """
        return self.model_dump_json()

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Protocol":
        """Create a Protocol instance from a dictionary.

        Args:
            data: A dictionary with keys matching the Protocol fields.

        Returns:
            A Protocol instance initialized from the dictionary.
        """
        return cls.model_validate(data)

    @classmethod
    def from_json(cls, json_str: str) -> "Protocol":
        """Deserialize a Protocol instance from a JSON string.

        Args:
            json_str: A JSON string representing a Protocol.

        Returns:
            A Protocol instance parsed from the JSON.
        """
        return cls.model_validate_json(json_str)
