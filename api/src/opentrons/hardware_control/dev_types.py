try:
    from typing_extensions import Protocol
except ModuleNotFoundError:
    Protocol = None  # type: ignore

if Protocol is not None:
    class RegisterModules(Protocol):
        async def __call__(
            self,
            new_modules: List[ModuleAtPort] = None,
            removed_modules: List[ModuleAtPort] = None
        ) -> None: ...
