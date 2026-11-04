"""Operator workflow independent of terminal and hardware implementations."""

from typing import Any, Callable

from .storage import CalibrationStore, Route


class OperatorAbort(Exception):
    """An operator ended the session without requesting further motion."""


def _offset_text(offset: dict[str, float]) -> str:
    return "  ".join(f"{axis.upper()}={offset[axis]:+.3f}" for axis in ("x", "y", "z"))


def _choice(terminal: Any, prompt: str, choices: set[str]) -> str:
    terminal.discard_pending()
    terminal.write(prompt)
    while True:
        key = terminal.read_key()
        if key in {"q", "ESC"}:
            raise OperatorAbort("操作者退出。")
        if key in choices:
            return str(key)


def adjust_and_release(terminal: Any, motion: Any) -> dict[str, float]:
    """Only allow release after an explicit descent, never save a hover position."""
    step = 0.1
    steps = {"1": 1.0, "2": 0.5, "3": 0.1, "4": 0.05}
    jogs = {
        "LEFT": ("x", -1),
        "RIGHT": ("x", 1),
        "DOWN": ("y", -1),
        "UP": ("y", 1),
        "PAGEDOWN": ("z", -1),
        "PAGEUP": ("z", 1),
        "f": ("z", -1),
        "r": ("z", 1),
    }
    terminal.write(
        "方向按机器人坐标：←/→ X-/X+；↓/↑ Y-/Y+；PageDown/PageUp Z-/Z+（F/R 同效）。\n"
        "1/2/3/4：步长 1/0.5/0.1/0.05 mm；D：下降到放置高度；Enter：释放后检查；Q：中止。\n"
        "当前在目标上方 10 mm，保持夹持。悬停阶段不能保存。请单次按键，不要长按。"
    )
    while True:
        terminal.discard_pending()
        phase = "放置高度" if motion.at_drop_height else "悬停（未下降）"
        terminal.write(
            f"[{phase}] 步长 {step:g} mm；候选偏移 {_offset_text(motion.candidate_offset())} mm"
        )
        key = terminal.read_key()
        if key in {"q", "ESC"}:
            raise OperatorAbort("夹持中止：保持当前状态，请按恢复说明处理。")
        if key in steps:
            step = steps[key]
        elif key in jogs:
            axis, sign = jogs[key]
            if motion.at_drop_height and step > 0.1:
                terminal.write("放置高度只允许 0.1 或 0.05 mm；请按 3 或 4。")
                continue
            # A backend exception is fatal: motion may have partially completed.
            motion.jog(axis, sign * step)
        elif key == "d":
            if motion.at_drop_height:
                terminal.write("已经下降到放置高度，不再重复下降。")
                continue
            if _choice(terminal, "确认下方目标空闲、XY 已对齐；按 D 下降，N 返回微调。", {"d", "n"}) == "d":
                motion.lower_to_drop_height()
                step = min(step, 0.1)
        elif key == "ENTER":
            if not motion.at_drop_height:
                terminal.write("尚在悬停高度；请先按 D 下降，不能释放或保存悬停位置。")
                continue
            if (
                _choice(
                    terminal,
                    "确认架子已到正确放置位置；按 Enter 释放并抬起夹爪，N 继续微调。",
                    {"ENTER", "n"},
                )
                == "ENTER"
            ):
                return dict(motion.release())


def run_routes(
    session: Any,
    store: CalibrationStore,
    routes: list[Route],
    terminal: Any,
    motion_factory: Callable[..., Any],
    rack_type: str,
) -> int:
    """Run any of the 80 directed routes with manual preparation between routes."""
    saved = 0
    for index, route in enumerate(routes, start=1):
        terminal.write(
            f"\n[{index}/{len(routes)}] {route.source} → {route.target}；{rack_type}；"
            f"原偏移 {_offset_text(store.get(route))} mm"
        )
        if (
            _choice(
                terminal,
                "先清空夹爪及 stacker shuttle，移除移液器吸头并避让 Impact 治具、路径障碍，关门；"
                "Enter 准备路线，S 跳过，Q 退出。",
                {"ENTER", "s"},
            )
            == "s"
        ):
            continue
        with session.protocol_context() as ctx:
            stacker_slot = (
                route.source if route.direction == "stacker_to_deck" else route.target
            )
            motion = motion_factory(
                ctx,
                rack_type,
                expected_stacker_serial=session.stacker_serials[stacker_slot],
                safety_check=session.raise_if_interrupted,
            )
            # Even module preparation can be interrupted midway. Be conservative
            # until the robot has returned to a known empty-gripper state.
            session.unsafe_to_restart = True
            motion.initialize_route(route)
            session.raise_if_interrupted()
            session.unsafe_to_restart = False
            terminal.write(
                f"将校准用 tip rack 放在起点 {route.source}；终点 {route.target} 必须为空。\n"
                "deck 端必须使用 96 tiprack adapter；stacker 端使用已伸出的 shuttle，不往 hopper 放料。\n"
                "夹爪附近请保持无人手和工具、关闭门；Enter 开始抓取，S 跳过，Q 退出。"
            )
            if _choice(terminal, "准备好后按 Enter。", {"ENTER", "s"}) == "s":
                continue
            session.unsafe_to_restart = True
            motion.prepare_route(route, store.get(route))
            offset = adjust_and_release(terminal, motion)
            if motion.holding_labware:
                raise RuntimeError("释放后夹持状态仍不确定，停止并保留恢复标记。")
            session.raise_if_interrupted()
            session.unsafe_to_restart = False
            answer = _choice(
                terminal,
                f"已释放；拟保存 {_offset_text(offset)} mm。\n"
                "检查架子是否正确落座；Y 确认并保存，N 不保存，Q 退出。",
                {"y", "n"},
            )
            if answer == "y":
                store.save(route, offset)
                saved += 1
                terminal.write(f"已保存并核验：{store.target_path}")
            else:
                terminal.write("本路线未保存。")
            _choice(
                terminal,
                "请人工取走测试架，让 shuttle 和 adapter 都为空；完成后按 Enter 继续。",
                {"ENTER"},
            )
            motion.finish_route()
    return saved
