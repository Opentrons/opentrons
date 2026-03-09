"""Utils for handling instrument serial."""


DEFAULT_INSTR_SERIAL_LENGTH = 16


def ensure_serial_length(
    input_val: bytes, target_length: int = DEFAULT_INSTR_SERIAL_LENGTH
) -> bytes:
    """Makes a bytestring exactly 12 bytes long by limiting length and padding with 0."""
    return (input_val + (b"\x00" * target_length))[:target_length]


def model_versionstring_from_int(model: int) -> str:
    """Format the encoded model from an int into a dotted version string."""
    return f"{model//10}.{model%10}"
