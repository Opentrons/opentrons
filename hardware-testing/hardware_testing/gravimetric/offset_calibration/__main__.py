"""Run the robot-side gripper route calibration terminal."""

import argparse
from pathlib import Path
import sys
from typing import Optional

from .operator import OperatorAbort, run_routes
from .storage import CalibrationStore, DECK_SLOTS, Route, STACKER_SLOTS, all_routes
from .terminal import Terminal


def parser() -> argparse.ArgumentParser:
    """Build the CLI without importing hardware or changing the robot environment."""
    result = argparse.ArgumentParser(
        description="Gravimetric gripper 全部 80 条路线的方向键校准。默认按顺序逐条执行。"
    )
    result.add_argument("--list", action="store_true", help="只列路线，不连接硬件或修改文件")
    result.add_argument("--rack", choices=("T50", "T200", "T1000"), default="T200")
    result.add_argument("--stacker", choices=STACKER_SLOTS, action="append")
    result.add_argument(
        "--direction",
        choices=("both", "stacker_to_deck", "deck_to_stacker"),
        default="both",
    )
    result.add_argument("--source", choices=STACKER_SLOTS + DECK_SLOTS)
    result.add_argument("--target", choices=STACKER_SLOTS + DECK_SLOTS)
    result.add_argument("--resume", action="store_true", help="跳过本机器人、架型及校准状态下已确认的路线")
    result.add_argument(
        "--acknowledge-recovery", action="store_true", help="人工处理异常夹持后，清除中断标记并恢复服务"
    )
    return result


def selected_routes(args: argparse.Namespace) -> list[Route]:
    """Filter the complete directed route set without silently accepting an empty set."""
    routes = [
        route
        for route in all_routes()
        if (args.direction == "both" or route.direction == args.direction)
        and (args.source is None or route.source == args.source)
        and (args.target is None or route.target == args.target)
        and (
            not args.stacker
            or route.source in args.stacker
            or route.target in args.stacker
        )
    ]
    if not routes:
        raise ValueError("筛选条件没有对应路线；仅支持 stacker 与 deck 间的两个方向。")
    return routes


def _recover() -> int:
    from .runtime import RECOVERY_CONFIRMATION, acknowledge_recovery

    print(
        "此操作不会移动、松爪或归零。必须先人工安全支撑/移除测试架，确认夹爪为空，"
        "并清空 shuttle。若无法安全处理，请停止并联系维护人员。\n"
        "完成后输入以下完整确认句：\n" + RECOVERY_CONFIRMATION
    )
    archived = acknowledge_recovery(input("> "))
    print(f"服务已恢复，中断记录归档到：{archived}")
    return 0


def configuration_paths(
    config_base: Path, override: Optional[Path]
) -> tuple[Path, Path]:
    """Preserve an existing persistent calibration when creating a new override file."""
    filename = "gravimetric_stacker_drop_offsets.json"
    persistent = config_base / "gravimetric" / filename
    packaged = (
        Path(__file__).resolve().parent.parent / "protocol_replacement" / filename
    )
    return override or persistent, persistent if persistent.is_file() else packaged


def _calibrate(args: argparse.Namespace, routes: list[Route]) -> int:
    from .runtime import RobotSession

    stackers = {
        slot
        for route in routes
        for slot in (route.source, route.target)
        if slot in STACKER_SLOTS
    }
    terminal = Terminal()
    with terminal.active():
        with RobotSession(stackers=stackers) as session:
            # The service environment must be restored before importing opentrons.
            from .motion import CalibrationMotion
            from opentrons.config import infer_config_base_dir

            target, baseline = configuration_paths(
                Path(infer_config_base_dir()), session.offset_override
            )
            store = CalibrationStore(
                target_path=target,
                baseline_path=baseline,
                robot_serial=session.robot_serial,
                rack_type=args.rack,
                calibration_fingerprint=session.calibration_fingerprint,
            )
            if args.resume:
                routes = [route for route in routes if not store.is_completed(route)]
            terminal.write(
                f"机器人：{session.robot_serial}；本次 {len(routes)} 条路线；偏移保存到 {target}\n"
                f"目标文件不存在时使用的基线：{baseline}\n"
                "每个方向单独校准；每条路线只保存一套偏移，T50/T200/T1000 共用。\n"
                "每条路线需人工放置/取走一个测试架；A3 路线需先移除 A3 垃圾桶并放置 adapter。"
            )
            saved = run_routes(
                session, store, routes, terminal, CalibrationMotion, args.rack
            )
            terminal.write(f"本次已确认保存 {saved} 条路线。")
    return 0


def main(argv: Optional[list[str]] = None) -> int:
    """Dispatch read-only listing, explicit recovery or a real robot session."""
    args = parser().parse_args(argv)
    try:
        if args.acknowledge_recovery:
            if args.list:
                raise ValueError("--list 与 --acknowledge-recovery 不能一起使用。")
            return _recover()
        routes = selected_routes(args)
        if args.list:
            for route in routes:
                print(f"{route.source} -> {route.target}  ({route.direction})")
            print(f"共 {len(routes)} 条路线；未连接硬件、未写文件。")
            return 0
        return _calibrate(args, routes)
    except (KeyboardInterrupt, EOFError, OperatorAbort) as error:
        print(f"\n会话已停止：{error}。若生成中断标记，请按恢复说明处理。", file=sys.stderr)
        return 130
    except Exception as error:
        print(f"\n校准失败：{type(error).__name__}: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
