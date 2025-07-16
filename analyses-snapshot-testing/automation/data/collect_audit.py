from rich import print
from rich.panel import Panel

from automation.data.collect import protocols_under_test
from automation.data.collect_direct import collect_protocols
from automation.data.protocol import (
    GENERATED_PROTOCOLS_FOLDER,
    MANUAL_PROTOCOL_LIBRARY_PROTOCOLS_FOLDER,
    PROTOCOL_DESIGNER_PROTOCOLS_FOLDER,
    PROTOCOL_LIBRARY_PROTOCOLS_FOLDER,
    PROTOCOLS_FOLDER,
)


def main():
    dirs = [
        PROTOCOLS_FOLDER,
        PROTOCOL_LIBRARY_PROTOCOLS_FOLDER,
        GENERATED_PROTOCOLS_FOLDER,
        MANUAL_PROTOCOL_LIBRARY_PROTOCOLS_FOLDER,
        PROTOCOL_DESIGNER_PROTOCOLS_FOLDER,
    ]
    direct_collect = collect_protocols(dirs)
    under_test_collect = protocols_under_test()

    direct_stems = {p.stem for p in direct_collect}
    under_test_stems = {p.file_stem for p in under_test_collect}
    print(f"Direct collect found {len(direct_stems)} protocols.")
    print(f"Under test found {len(under_test_stems)} protocols.")
    missing = direct_stems - under_test_stems
    extra = under_test_stems - direct_stems

    if not missing and not extra:
        print(Panel("All protocols are under test.", title="Protocol Audit"))
    else:
        msg = ""
        if missing:
            msg += f"Missing protocols under test: {', '.join(sorted(missing))}\n"
        if extra:
            msg += f"Extra protocols under test (not in direct collect): {', '.join(sorted(extra))}"
        print(Panel(msg.strip(), title="Protocol Audit"))


if __name__ == "__main__":
    main()
