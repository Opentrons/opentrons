"""Top-level ProtocolEngine configuration options."""
from dataclasses import dataclass


@dataclass(frozen=True)
class Config:
    """ProtocolEngine configuration options.

    Params:
        ignore_pause: The engine should no-op instead of waiting
            for pauses and delays to complete.
        use_virtual_modules: The engine should no-op instead of calling
            modules' hardware control API.
        block_on_door_open: Protocol execution should pause if the
            front door is opened.
    """

    ignore_pause: bool = False
    use_virtual_modules: bool = False
    block_on_door_open: bool = False
