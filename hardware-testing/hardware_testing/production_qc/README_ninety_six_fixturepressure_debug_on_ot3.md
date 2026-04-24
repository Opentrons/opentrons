# Run `ninety_six_fixturepressure_debug.py` On OT3

This flow is meant to avoid fixture damage when the operator laptop disconnects from OT3 during a run.

## Why run on OT3

If the test is launched from a laptop and the laptop loses network connectivity to OT3, the control process dies on the client side and OT3 may remain in the fixture pick-up state. Running the test process on OT3 keeps the motion commands local to the robot so a laptop disconnect does not stop the test process.

## Start from OT3

From the OT3 shell:

```bash
cd /path/to/opentrons
bash hardware-testing/hardware_testing/production_qc/run_ninety_six_fixturepressure_debug_on_ot3.sh \
  --pipette 1000 \
  --repeat-count 10
```

The launcher starts a detached `tmux` session and writes a log to `/tmp`.

## Useful commands

Attach to the running session:

```bash
tmux attach -t n96_fixturepressure_debug
```

Stop the running session:

```bash
tmux kill-session -t n96_fixturepressure_debug
```

## Notes

- The launcher runs `python3 -m hardware_testing.production_qc.ninety_six_fixturepressure_debug` from the `hardware-testing` repo directory so package-relative imports continue to work.
- If a session with the same name already exists, the launcher exits instead of starting a second copy.




1. 登录 OT3

ssh root@<OT3_IP>
2. 启动测试
如果你现在测的是 p1000，一套比较完整的命令可以用：

bash hardware-testing/hardware_testing/production_qc/run_ninety_six_fixturepressure_debug_on_ot3.sh --pipette 1000 --repeat-count 10 --fail-count-threshold 3

如果你测的是 p200，把 --pipette 1000 改成：

--pipette 200

3. 进入 tmux 做校准 / 看运行过程

tmux attach -t n96_fixturepressure_debug
进入后你就可以：

看脚本输出
在第一轮做 jog 校准位置
继续观察测试过程
4. 测试跑完后退出 tmux
只退出画面，不杀任务：

Ctrl-b d
5. 如果要强制停止

tmux kill-session -t n96_fixturepressure_debug

