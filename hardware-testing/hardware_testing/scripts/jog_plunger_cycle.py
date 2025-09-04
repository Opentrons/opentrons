"""Jog to a position and cycle plunger between drop tip position and home."""
import argparse
import asyncio
import os
from datetime import datetime
from pathlib import Path
from time import time
from typing import Optional

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.data import csv_report


# 确保保存目录存在
def ensure_directory_exists(directory_path: str) -> None:
    """确保目录存在，如果不存在则创建"""
    path = Path(directory_path)
    path.mkdir(parents=True, exist_ok=True)


async def _cycle_plunger(api: OT3API, mount: types.OT3Mount, cycles: int = 0, csv_file_path: Optional[str] = None) -> None:
    """循环移动plunger到drop tip位置然后回到bottom位置，并记录到CSV文件。"""
    # 获取plunger位置信息
    plunger_poses = helpers_ot3.get_plunger_positions_ot3(api, mount)
    top, bottom, blowout, drop_tip = plunger_poses
    
    # 创建CSV报告
    report = None
    if csv_file_path:
        # 创建一个空的sections列表
        sections = []
        # 创建测试数据部分
        cycle_section = csv_report.CSVSection(
            "CYCLE_DATA",
            [
                csv_report.CSVLine("cycle_number", [int]),
                csv_report.CSVLine("timestamp", [float]),
                csv_report.CSVLine("drop_tip_position", [float]),
                csv_report.CSVLine("cycle_time", [float]),
                csv_report.CSVLine("status", [csv_report.CSVResult]),
            ],
        )
        sections.append(cycle_section)
        
        # 生成run_id
        run_id = f"run_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # 正确初始化CSVReport
        report = csv_report.CSVReport(
            test_name=f"Plunger_Cycle_Test_{mount.name}",
            sections=sections,
            run_id=run_id,  # 直接传入run_id参数
            validate_meta_data=False
        )
        
        # 设置其他元数据
        report.set_tag(f"ejector_lifetime_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
        report.set_device_id(f"pipette_{mount.name}", f"pipette_{mount.name}")
        
        # 获取机器人序列号
        robot_serial = helpers_ot3.get_robot_serial_ot3(api) if not api.is_simulator else "simulator"
        report.set_robot_id(robot_serial)
        report.set_operator(input("请输入操作员姓名: ") if not api.is_simulator else "simulator")
        report.set_version("1.0.0")
        report.set_firmware(api.fw_version)
    
    cycle_count = 0
    try:
        while cycles == 0 or cycle_count < cycles:
            cycle_start_time = time()
            print(f"循环 {cycle_count + 1}: 移动到drop tip位置")
            
            # 移动到drop tip位置
            try:
                await helpers_ot3.move_plunger_absolute_ot3(api, mount, drop_tip)
                drop_tip_success = True
            except Exception as e:
                print(f"移动到drop tip位置失败: {e}")
                drop_tip_success = False
            
            print("移动到bottom位置")
            # 移动到bottom位置
            try:
                await helpers_ot3.move_plunger_absolute_ot3(api, mount, bottom)
                bottom_success = True
            except Exception as e:
                print(f"移动到bottom位置失败: {e}")
                bottom_success = False
                
            cycle_end_time = time()
            cycle_time = cycle_end_time - cycle_start_time
            cycle_count += 1
            
            # 记录到CSV
            if report and csv_file_path:
                cycle_section = report["CYCLE_DATA"]  # 使用索引访问已创建的section
                cycle_section["cycle_number"].cache_start_time(cycle_start_time)
                cycle_section["timestamp"].cache_start_time(cycle_start_time)
                cycle_section["drop_tip_position"].cache_start_time(cycle_start_time)
                cycle_section["cycle_time"].cache_start_time(cycle_start_time)
                cycle_section["status"].cache_start_time(cycle_start_time)
                
                status = csv_report.CSVResult.PASS if (drop_tip_success and bottom_success) else csv_report.CSVResult.FAIL
                
                cycle_section["cycle_number"].store(cycle_count, print_results=False)
                cycle_section["timestamp"].store(cycle_end_time, print_results=False)
                cycle_section["drop_tip_position"].store(drop_tip, print_results=False)
                cycle_section["cycle_time"].store(cycle_time, print_results=False)
                cycle_section["status"].store(status)
                
                # 每10次循环保存一次CSV文件
                if cycle_count % 10 == 0:
                    report.save_to_disk()  # 使用正确的方法名save_to_disk
                    print(f"已保存CSV数据到: {report.file_path}")
            
            # 如果设置了循环次数，显示进度
            if cycles > 0:
                print(f"完成 {cycle_count}/{cycles} 次循环")
            
            # 每次循环后暂停一下，让用户有机会中断
            if cycles == 0:
                user_input = input("按Enter继续下一个循环，输入'q'退出: ")
                if user_input.lower() == 'q':
                    break
    except KeyboardInterrupt:
        print("用户中断，停止循环")
    
    # 保存最终CSV报告
    if report and csv_file_path:
        report.save_to_disk()  # 使用正确的方法名save_to_disk
        print(f"已保存CSV数据到: {report.file_path}")
    
    print(f"总共完成了 {cycle_count} 次循环")


async def _main(is_simulating: bool, mount: types.OT3Mount, cycles: int, speed: Optional[float], csv_dir: Optional[str]) -> None:
    """主函数：jog到位置，然后循环plunger。"""
    # 初始化API
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    
    # 准备CSV文件路径
    csv_file_path = None
    if csv_dir:
        ensure_directory_exists(csv_dir)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        csv_file_name = f"plunger_cycle_{mount.name}_{timestamp}.csv"
        csv_file_path = os.path.join(csv_dir, csv_file_name)
    
    # 首先home所有轴
    print("Home所有轴...")
    await api.home()
    
    # 让用户jog到所需位置
    print("请使用jog命令移动到所需位置:")
    await helpers_ot3.jog_mount_ot3(api, mount, speed=speed)
    
    # 开始循环plunger
    print("开始plunger循环测试...")
    await _cycle_plunger(api, mount, cycles, csv_file_path)

    print("Home z 轴...")
    await api.home([Axis.Z_L])



if __name__ == "__main__":
    mount_options = {
        "left": types.OT3Mount.LEFT,
        "right": types.OT3Mount.RIGHT,
    }
    
    parser = argparse.ArgumentParser(description="Jog到位置并循环plunger到drop tip位置然后到bottom位置")
    parser.add_argument("--simulate", action="store_true", help="使用模拟模式")
    parser.add_argument(
        "--mount", type=str, choices=list(mount_options.keys()), default="left",
        help="选择使用的mount (默认: left)"
    )
    parser.add_argument(
        "--cycles", type=int, default=0,
        help="循环次数 (默认: 0，表示无限循环直到用户中断)"
    )
    parser.add_argument(
        "--speed", type=float, help="移动速度 (可选)"
    )
    parser.add_argument(
        "--csv-dir", type=str, default="/data/testing_data/ejector_lifetime/",
        help="CSV文件保存目录 (默认: /data/testing_data/ejector_lifetime/)"
    )
    
    args = parser.parse_args()
    _mount = mount_options[args.mount]
    
    asyncio.run(_main(args.simulate, _mount, args.cycles, args.speed, args.csv_dir))