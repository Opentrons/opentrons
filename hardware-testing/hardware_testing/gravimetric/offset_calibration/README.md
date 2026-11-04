# Gravimetric gripper 路线偏移校准

从电脑运行脚本，通过 SSH 终端的方向键调整 **OT3 上真实夹持的 tip rack**。
确认落座后，自动保存生产协议使用的 `drop_offset`。
这是人工确认的工程校准工具，每条路线需要人工放置、检查和取走测试架。

## 覆盖范围

| 项目 | 范围 |
|---|---|
| Stacker | A4、B4、C4、D4 |
| Deck | D2、D3、C2、C3、B1、B2、B3、A1、A2、A3 |
| 方向 | stacker → deck 40 条，deck → stacker 40 条，共 **80 条** |
| 架型 | T50、T200、T1000；默认 T200 |
| Deck 底座 | `opentrons_flex_96_tiprack_adapter` |

每条路线只有一套 XYZ，三种架型共用。用一种架型保存后，其他架型应再验证；工具不会创建三套生产配置。
A3 也可测试，但需移除 A3 垃圾桶并安装 adapter，App 的实际 deck 配置必须与实物一致。
准备 shuttle 时只做空平台复位/伸出，不从 hopper 自动取料，也不执行生产回收流程。

## 部署与启动

本工具针对本工程的 **robot software 9.1.2 / Protocol API 2.29** 实现。
使用了该版本的内部 Engine 接口；其他 robot software 版本会在运动前拒绝运行。

先将此分支的 `hardware-testing` 部署到机器人。以下命令在工程根目录执行，SSH 密钥按实际情况填写：

```sh
cd /Users/yew/opentrons
make -C hardware-testing push-ot3 host=192.168.6.177 ssh_key="$HOME/.ssh/id_rsa"
```

生产使用的 `gravimetric_speed.py` 也必须是本分支的新版本；如果在 App 中运行此前上传的旧协议，请重新上传。
旧协议副本不会因为更新 Python 包而自动增加新的校准文件查找路径。

电脑端只需 Python 3，无需安装机器人硬件依赖：

```sh
# 全部 80 条；每条都需要人工确认，不会自动连续搬运。
python3 hardware-testing/gravimetric_offset_calibration.py \
  --host 192.168.6.177 --key "$HOME/.ssh/id_rsa" --rack T200

# 从同一机器人、架型、校准状态下未完成的路线继续。
python3 hardware-testing/gravimetric_offset_calibration.py \
  --host 192.168.6.177 --key "$HOME/.ssh/id_rsa" --rack T200 --resume

# 只测试 A4 的两个方向，共 20 条。
python3 hardware-testing/gravimetric_offset_calibration.py \
  --host 192.168.6.177 --stacker A4 --rack T200

# 单条路线。
python3 hardware-testing/gravimetric_offset_calibration.py \
  --host 192.168.6.177 --source D2 --target A4 --rack T200
```

`--stacker` 可以多次指定。`--direction stacker_to_deck` 或 `--direction deck_to_stacker`
可只测试一个方向。未提供 `--key` 时使用系统 SSH 默认密钥/ssh-agent。

离线检查路线列表，不连接 OT3，也不写文件：

```sh
PYTHONPATH=hardware-testing python3 -m hardware_testing.gravimetric.offset_calibration --list
```

加在电脑启动命令后的 `--list` 会通过 SSH 在机器人上列路线，但同样不会取得硬件控制权。

## 一条路线如何操作

1. 退出 App 中当前协议/维护任务。夹爪必须为空，gripper 基础校准有效，所选 stacker 的安装开关必须检测正常。
   启动时工具会校验设备、实际 deck 配置和模块序列号，然后暂时停止 robot-server，独占硬件。
2. 清空所选 shuttle、移除移液器吸头、避让 Impact 治具及路径内障碍、关闭机器人门，按 Enter。
   机器人归零并把**空 shuttle**准备到伸出状态。等待屏幕提示完成后再放架。
3. 将测试架放在指定起点：deck 端放在 adapter 上，stacker 端放在伸出的 shuttle 上。
   目标必须为空。手和工具移出运动区域、关门后按 Enter，夹爪抓取并移动至目标上方 10 mm。
4. 使用下表调整。界面显示的是“原偏移 + 本次修正”，不把 10 mm 悬停高度算进去。
5. XY 对齐后按 D，再按 D 确认下降。工具保持当前 XYZ 修正，只去掉悬停高度。
   放置高度仅允许 0.1 或 0.05 mm 微调。
6. 按 Enter，再按 Enter 确认释放。工具读取最终坐标、释放架子并抬起夹爪。
7. 检查实际落座效果。按 Y 才写入偏移；N 不保存。随后人工取走测试架，按 Enter 进入下一条路线。

| 按键 | 动作 |
|---|---|
| ← / → | 机器人 X- / X+ |
| ↓ / ↑ | 机器人 Y- / Y+ |
| PageDown / PageUp | Z- / Z+；Mac 可用 Fn+↓ / Fn+↑ |
| F / R | 同样是 Z- / Z+，用于没有 Page 键的键盘 |
| 1 / 2 / 3 / 4 | 步长 1 / 0.5 / 0.1 / 0.05 mm，默认 0.1 mm |
| D | 确认后下降到放置高度 |
| Enter | 放置高度确认释放；悬停时不允许释放 |
| Y / N | 释放、检查后保存 / 不保存 |
| S | 准备阶段跳过当前路线 |
| Q / Esc | 中止，不自动放下夹持中的架子 |

方向是机器坐标轴，勿按观察视角推断。每次单独按键；一次动作完成前输入的按键会丢弃，避免排队连续移动。
候选偏移每轴限制在 ±10 mm，超过范围会中止本路线。
实时门/急停保护可能使路线中断；关闭门后不会自动继续未完成动作。
此工具仍要求操作者确认实际路径，不能识别外部治具、未建模障碍或错误放置的架子。

## 偏移计算与生产读取

保存值是 `实际释放前坐标 − 生产 Engine 的名义 DROP_LABWARE 坐标`，单位 mm。
名义坐标包含机器人/模块/adapter 的几何与校准；不会把 pipette LPC 当作 gripper 偏移。
方向独立：A4→D2 的 drop offset 不会作为 D2→A4 的 pickup offset，也不会自动取反。

正常配置下，文件写入：

```text
/data/gravimetric/gravimetric_stacker_drop_offsets.json
```

如果 robot-server 设置了 `GRAVIMETRIC_STACKER_DROP_OFFSETS_CONFIG`，工具继承服务的设置并写入该**绝对路径**。
相对路径会被拒绝。自定义 `OT_API_CONFIG_DIR` 时，默认文件在其 `gravimetric` 子目录。
屏幕会显示实际目标文件。

新 `gravimetric_speed.py` 的读取顺序为：

1. 服务环境变量指定的 JSON。
2. 机器人配置目录下 `gravimetric/gravimetric_stacker_drop_offsets.json`。
3. 协议脚本旁边的 JSON。
4. 安装包中 `protocol_replacement` 目录的 JSON。
5. 旧 `hardware_testing/gravimetric/protocol_replacement` 配置目录。

首次确认前不创建生产偏移文件。目标不存在时，从当前安装包的完整 80 路线 JSON 初始化；
若正在新建环境变量指定的文件，而持久化校准文件已存在，则继承这份当前生效的校准值。
目标已存在时以它为准，要求全部 80 路线及每条 XYZ 完整且为有限数值。
**部分 JSON 会被拒绝**：生产旧逻辑对缺项使用代码内置默认，直接用包内 JSON 补项可能改变未校准路线。
若要迁移这种旧文件，需先按“生产内置默认 + 旧 JSON”生成完整有效配置，再开始校准。

每次确认只更新一条路线，其他路线值保留。保存使用临时文件、原子替换、写后 SHA 核验；
旧配置备份在旁边的 `gravimetric_stacker_drop_offsets.backups/`。
进度/历史在 `gravimetric_stacker_drop_offsets.calibration.json`，不会改变生产 JSON 格式。
备份、历史文件名随自定义配置文件名变化。
如果偏移写成功而历史写失败，工具明确报错，已确认偏移保留，下次须重新确认该路线。
校准期间检测到文件被其他进程修改，会拒绝覆盖；不要同时手工编辑或推送 JSON。

`--resume` 依据每条路线最新确认、机器人序列号、架型、gripper/deck/module 校准指纹及当前偏移值判断。
更换硬件、重新基础校准或更改 deck 配置后需要重新确认；换架型也重新验证。
共享偏移被另一架型确认后，原架型的旧进度不会被视为最新验证。

## 中断与恢复

正常完成、或确认空爪后按 Q，工具关闭通信并恢复 robot-server。
夹持过程中按 Q、SSH 断线、运动失败或进程异常退出时，不自动松爪/归零。
服务保持停止，记录留在：

```text
/data/gravimetric/offset-calibration.interrupted.json
```

再次启动会拒绝运动。先人工安全支撑或移除测试架，确认夹爪为空并清空 shuttle，
再使用显式恢复入口；若无法安全处理，请按设备维护流程处理：

```sh
python3 hardware-testing/gravimetric_offset_calibration.py \
  --host 192.168.6.177 --acknowledge-recovery
```

输入屏幕显示的完整英文确认句后，恢复服务并归档中断记录。此入口不发出运动/松爪/归零命令。
不要在仍夹持架子时手工重启服务或删除中断标记。掉电/机器人重启后也须检查实物；
中断文件不能阻止系统启动时自动启动服务。

## 本地验证

```sh
cd hardware-testing
.venv/bin/python -m pytest -q \
  tests/hardware_testing/gravimetric/test_offset_calibration_storage.py \
  tests/hardware_testing/gravimetric/test_offset_calibration_motion.py \
  tests/hardware_testing/gravimetric/test_offset_calibration_runtime.py \
  tests/hardware_testing/gravimetric/test_offset_calibration_operator.py \
  tests/hardware_testing/gravimetric/test_stacker_drop_offsets.py
```

测试覆盖全部 80 路线的 Engine 几何与位置同步、三种架型、按键确认、异常退出及文件读写。
这些是模拟/自动化验证，不代表实机落座精度已验证。需要按上述操作在真实 OT3 上确认。
本功能不修改蒸发计算、测量调度、固定回收流程或包内已有偏移数值。
