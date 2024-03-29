import argparse
import asyncio
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import (
    OT3Mount,
    Point,
    Axis,
)
from serial.tools.list_ports import comports  # type: ignore[import]
from hardware_testing.drivers import particle_instrument
from hardware_testing.drivers import uv_instrument
from typing import Optional, Callable, List, Any, Tuple, Dict  
from dataclasses import dataclass, fields 
from hardware_testing import data 
from pathlib import Path
from time import time,sleep
import os
from opentrons.hardware_control.ot3api import OT3API
PRESSURE_DATA_CACHE = []
FINAL_TEST_RESULTS = []
GRIP_HEIGHT_MM = 48
GAUGE_HEIGHT_MM = 75
SLOT_WIDTH_GAUGE: List[Optional[int]] = [[], [], []]
from datetime import datetime
warm_up_time = 190

async def _main(arguments: argparse.Namespace) -> None:
    try:
        operator = input("Enter Operator Name(输入测试者名称):: ").strip()
        HEPASN = input("Enter HEPA/UV Barcode Number(输入HEPA/UV条码):: ").strip()

        input("CLEAN OT3FLEX,CLOSE DOOR,PRESS ENTER TO CONTINUE(清洁0T3后,关闭OT3门,按回车键开始测试)").strip()

        api = await helpers_ot3.build_async_ot3_hardware_api(
            is_simulating=arguments.simulate, use_defaults=True
        )
        # home and move to attach position
        await api.home()
        instrument = BuildAsairGT521S()
        uvinstrument = BuildAsairUV()
        INTSN = instrument.serial_number().strip("SS").replace(' ', '')
        csv_props, csv_cb = _create_csv_and_get_callbacks(HEPASN)
        
        csv_cb.write(["operator:", operator])
        csv_cb.write(["test_time:", datetime.utcnow().strftime("%Y/%m/%d-%H:%M:%S")])
        csv_cb.write(["INSTRUMENT SN:", INTSN])
        csv_cb.write(["HEPA SN:" , HEPASN])

        if not arguments.skip_fan:
            slotc2 = (229.71,196.32,291.17)
            await helpers_ot3.move_to_arched_ot3(api, OT3Mount.LEFT, Point(slotc2[0], slotc2[1], slotc2[2]))
            test_data={
                            'Time(Date Time)': None,
                            'Size1(um)': None,
                            'Count1(M3)': None,
                            'Size2(um)': None,
                            'Count2(M3)': None,
                            'Location': None,
                            'Sample Time(sec)': None,
                            'PASS/FAIL': None,
                                }
                                
        
            input("TURN ON FAN,PRESS ENTER TO CONTINUE.(打开风扇后,按回车键继续)")
            instrument.initialize_connection()
            instrument.clear_data()
            instrument.set_number_of_samples(6)
            instrument.start_sampling()
            await asyncio.sleep(3)
            #Determines if the MetOne Device is running
            operation = True
            try:
                i = 0
                while operation:
                    stats = instrument.operation_status()
                    if stats == "Stop":
                        operation = False
                    print(stats,str(i)+"S")
                    print('\r', end='')
                    await asyncio.sleep(1)
                    i += 1
            except Exception as errval:
                print("errval",errval)
            #print out the data
            header, data = instrument.available_records()
            #Record to designated columns using a sorting loop
            record_dict = {}
            csv_cb.write(list(test_data.keys()))
            time_dict = {
                0:30,
                1:60,
                2:90,
                3:120,
                4:150,
                5:180
            }

            for number in range(6):
                for key, value in zip(header.items(), data[number]):
                    for element in key:
                        record_dict[element]= value
                particle_count_1 = int(record_dict['Count1(M3)'])
                particle_count_2 = int(record_dict['Count2(M3)'])
                test_result = \
                        determine_criterion(particle_count_1, particle_count_2)
                #print(record_dict)
                test_data['Time(Date Time)']=time_dict[number] #record_dict['Time']
                test_data['Size1(um)']=record_dict['Size1']
                test_data['Count1(M3)']=record_dict['Count1(M3)']
                test_data['Size2(um)']=record_dict['Size2']
                test_data['Count2(M3)']=record_dict['Count2(M3)']
                test_data['Location']=record_dict['Location']
                test_data['Sample Time(sec)']=record_dict['Sample Time']
                test_data['PASS/FAIL'] = test_result
                csv_cb.write(list(test_data.values()))
            input("TURN OFF FAN,PRESS ENTER TO CONTINUE.(关闭风扇后,按回车键继续)")
        
        await api.home()
        if not arguments.skip_uv:
            input("PLACE THE UV METER ON THE SLOT B3 TO START TEST(将紫外线计放置在插槽B2上开始测试)")
            #UV
            
            test_data2={
                        'SLOT': None,
                        'uvdata': None,
                        
                            }
            csv_cb.write(list(test_data2.keys()))
            #GRIP_SLOT = [[8,5,"home"],[5,10,"home"],[10,"A4",1],["A4",1,"home"],[1,"D4","home"]]
            GRIP_SLOT_DICIT = {"GRIP":(8,5,10,"A4",1),
            "UNGRIP":(5,10,"A4",1,"D4"),
            "HOME":("home","home",10,"home","home")
            }
            slot_loc = {
            "A4": (554.2, 363.72, 27.04),
            "D4": (554.21, 41.77, 27.04)
            }

            slot_name = {
                1:"D1",
                8:"B2",
                5:"C2",
                10:"A1",
                "A4":"A4",
                "D4":"D4"
            
            }
            mount = OT3Mount.GRIPPER
            tetsuv = False
            for iii in range(5):

                grip_slot1 = GRIP_SLOT_DICIT["GRIP"][iii]
                hover_pos = (0, 0, 0)
                if grip_slot1 == "A4" or grip_slot1 == "D4":
                    
                    hover_pos = slot_loc[grip_slot1]
                    hover_over_slot_3 = Point(x=hover_pos[0],y=hover_pos[1],z=hover_pos[2])
                    await helpers_ot3.move_to_arched_ot3(api, mount, hover_over_slot_3)

                    
                else:
                    hover_pos = helpers_ot3.get_slot_calibration_square_position_ot3(grip_slot1)
                    await helpers_ot3.move_to_arched_ot3(api, mount, hover_pos + Point(0, 0, 10))
                await api.grip(30)
                await api.home([Axis.Z_G])



                grip_slot2 = GRIP_SLOT_DICIT["UNGRIP"][iii]
                print(grip_slot2)
                if grip_slot2 == "A4" or grip_slot2 == "D4":
                    hover_pos = slot_loc[grip_slot2]
                    hover_over_slot_3 = Point(x=hover_pos[0],y=hover_pos[1],z=hover_pos[2]-3)
                    await helpers_ot3.move_to_arched_ot3(api, mount, hover_over_slot_3)
                    
                else:
                    hover_pos = helpers_ot3.get_slot_calibration_square_position_ot3(grip_slot2)
                    await helpers_ot3.move_to_arched_ot3(api, mount, hover_pos + Point(0, 0, 10))
                await api.ungrip()
                
               

                grip_slot = GRIP_SLOT_DICIT["HOME"][iii]
                print(grip_slot)
                if grip_slot == 10:
                    await api.home([Axis.X, Axis.Y, Axis.Z_L,Axis.Z_G,Axis.G])
                    hover_pos = helpers_ot3.get_slot_calibration_square_position_ot3(grip_slot)
                    current_pos = await api.gantry_position(mount)
                    hover_over_slot_3 = Point(x=hover_pos[0],y=hover_pos[1],z=current_pos[2])
                    await helpers_ot3.move_to_arched_ot3(api, mount, hover_over_slot_3)
                else:
                    await api.home([Axis.X, Axis.Y, Axis.Z_L,Axis.Z_G,Axis.G])

                #获取数据UV get uv data
                aa = input("Test Slot {} Press open UV to continue...(开始测试位置{} 打开UV灯后,回车继续)".format(grip_slot2,grip_slot2))

                for i in range(11):
                    await asyncio.sleep(1)
                    print(i+1,"S")
                # alldata = uvinstrument.get_uv_()
                # intdatadict = uvinstrument.parse_modbus_data(alldata)
                intdatadict = uvinstrument.get_stable_uv()
                print(intdatadict)
                aa = input("Press close UV to continue...(关闭UV灯后,回车继续)")

                

                test_data2['SLOT']=slot_name[grip_slot2]
                test_data2['uvdata']=intdatadict
                csv_cb.write(list(test_data2.values()))

                # LOOP THROUGH FORCES
                if iii == 4:
                    tetsuv = True
        
        if tetsuv:
            print("home(环境恢复)")
            hover_pos = slot_loc["D4"]
            hover_over_slot_3 = Point(x=hover_pos[0],y=hover_pos[1],z=hover_pos[2]-1)
            await helpers_ot3.move_to_arched_ot3(api, mount, hover_over_slot_3)
            await api.grip(30)
            await api.home([Axis.Z_G])
            hover_pos = helpers_ot3.get_slot_calibration_square_position_ot3(8)
            # MOVE TO SLOT
            await helpers_ot3.move_to_arched_ot3(api, mount, hover_pos + Point(0, 0, 10))
            await api.ungrip()
            await api.home()

    except Exception as err:
        print("err:",err)
    finally:
        await api.retract(mount)
        await api.home()
        print(f"CSV: {csv_props.name}")

async def UV_test(simulating: bool):
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=simulating, use_defaults=True
    )
    for width, slot in  SLOT_WIDTH_GAUGE:
        await api.ungrip()
        if slot is not None:
            hover_pos, target_pos = _get_width_hover_and_grip_positions(api, slot)
            # MOVE TO SLOT
            mount = OT3Mount.GRIPPER
            await helpers_ot3.move_to_arched_ot3(api, mount, hover_pos)
            # OPERATOR SETS UP GAUGE
            
            # GRIPPER MOVES TO GAUGE
            await api.move_to(mount, target_pos)
            
            # grip once to center the thing
            await api.grip(20)
            await api.ungrip()
        # LOOP THROUGH FORCES

def _get_width_hover_and_grip_positions(api: OT3API, slot: int) -> Tuple[Point, Point]:
    grip_pos = helpers_ot3.get_slot_calibration_square_position_ot3(slot)
    grip_pos += Point(z=GRIP_HEIGHT_MM)
    hover_pos = grip_pos._replace(z=GAUGE_HEIGHT_MM + 15)
    return hover_pos, grip_pos

def determine_criterion(p_1, p_2):
    """
    p_1 is the particle/m^3 measurement unit for particle size of 0.3um
    p_2 is the particle/m^3 measurement unit for particle size of 0.5um
    These p_1 & p_2 have to be in a certain particle count value
    to determine if the HEPA is in clean and working condition.
    If p_1 & p_2 are higher than the threshold the filter is probably
    puctured with holes defining the HEPA system is not clean enough
    to send to a customer.
    """
    p1_threshold = 8160
    p2_threshold = 2816
    if p_1 < p1_threshold and p_2 < p2_threshold:
        test_result = 'PASS'
    else:
        test_result = 'FAIL'
    return test_result
    
def pause():
    """This acts as a counter to notify the user"""
    time_suspend = 0
    while time_suspend < warm_up_time:
        sleep(1)
        time_suspend +=1
        print('Time: ', time_suspend, ' (s)' , end='')
        print('\r', end='')
    print('')
ports = comports()
def BuildAsairGT521S():
    """Try to find and return an GT-521S, if not found return FALSE."""
    print("Connecting to GT-521S")

    
    assert ports
    for _port in ports:
        port = _port.device  # type: ignore[attr-defined]
        try:
            print(f"Trying to connect to env sensor on port {port}")
            sensor = particle_instrument.GT521S_Driver(port)
            ser_id = sensor.serial_number().strip("SS").replace(' ', '')
            if len(ser_id) != 0:
                print(f"Found GT-521S {ser_id} on port {port} SN: {ser_id}")
                ports.remove(_port)
                return sensor
        except:  # noqa: E722
            pass
    port = list_ports_and_select(device_name="Asair GT-521S")
    sensor = particle_instrument.GT521S_Driver(port)
    print(f"Found GT-521S on port {port}")
    return sensor

def BuildAsairUV():
    """Try to find and return an UV, if not found return FALSE."""
    print("Connecting to UV")

    
    assert ports
    for _port in ports:
        port = _port.device  # type: ignore[attr-defined]
        try:
            print(f"Trying to connect to env sensor on port {port}")
            sensor = uv_instrument.uv_Driver(port)
            ser_id = sensor.get_uv_()
            if len(ser_id) != 0:
                print(f"Found uv {ser_id} on port {port}")
                return sensor
        except:  # noqa: E722
            pass
    port = list_ports_and_select(device_name="Asair GT-521S")
    sensor = uv_instrument.uv_Driver(port)
    print(f"Found uv on port {port}")
    return sensor

def list_ports_and_select(device_name: str = "") -> str:
    """List serial ports and display list for user to select from."""
    ports = comports()
    assert ports, "no serial ports found"
    ports.sort(key=lambda p: p.device)
    print("found ports:")
    for i, p in enumerate(ports):
        print(f"\t{i + 1}) {p.device}")
    if not device_name:
        device_name = "desired"
    idx_str = input(
        f"\nenter number next to {device_name} port (or ENTER to re-scan): "
    )
    if not idx_str:
        return list_ports_and_select(device_name)
    try:
        idx = int(idx_str.strip())
        return ports[idx - 1].device
    except (ValueError, IndexError):
        return list_ports_and_select()


@dataclass
class CSVCallbacks:
    """CSV callback functions."""

    write: Callable
    pressure: Callable
    results: Callable


@dataclass
class CSVProperties:
    """CSV properties."""

    id: str
    name: str
    path: str 

def _bool_to_pass_fail(result: bool) -> str:
    return "PASS" if result else "FAIL"

def _create_csv_and_get_callbacks(
    pipette_sn: str,
) -> Tuple[CSVProperties, CSVCallbacks]:
    run_id = data.create_run_id()
    test_name = Path(__file__).parent.name.replace("_", "-")
    folder_path = data.create_folder_for_test_data(test_name)
    run_path = data.create_folder_for_test_data(folder_path / run_id)
    file_name = data.create_file_name(test_name, run_id, pipette_sn)
    csv_display_name = os.path.join(run_path, file_name)
    print(f"CSV: {csv_display_name}")
    start_time = time()

    def _append_csv_data(
        data_list: List[Any],
        line_number: Optional[int] = None,
        first_row_value: Optional[str] = None,
        first_row_value_included: bool = False,
    ) -> None:
        # every line in the CSV file begins with the elapsed seconds
        if not first_row_value_included:
            if first_row_value is None:
                first_row_value = str(round(time() - start_time, 2))
            data_list = [first_row_value] + data_list
        data_str = ",".join([str(d) for d in data_list])
        if line_number is None:
            data.append_data_to_file(test_name, run_id, file_name, data_str + "\n")
        else:
            data.insert_data_to_file(
                test_name, run_id, file_name, data_str + "\n", line_number
            )

    def _cache_pressure_data_callback(
        d: List[Any], first_row_value: Optional[str] = None
    ) -> None:
        if first_row_value is None:
            first_row_value = str(round(time() - start_time, 2))
        data_list = [first_row_value] + d
        PRESSURE_DATA_CACHE.append(data_list)

    def _handle_final_test_results(t: str, r: bool) -> None:
        # save final test results to both the CSV and to display at end of script
        _res = [t, _bool_to_pass_fail(r)]
        _append_csv_data(_res)
        FINAL_TEST_RESULTS.append(_res)

    return (
        CSVProperties(id=run_id, name=test_name, path=csv_display_name),
        CSVCallbacks(
            write=_append_csv_data,
            pressure=_cache_pressure_data_callback,
            results=_handle_final_test_results,
        ),
    )
if __name__ == "__main__":
    arg_parser = argparse.ArgumentParser(description="OT-3 HEPA/UV Assembly QC Test")
    arg_parser.add_argument("--simulate", type=bool, default=False)
    arg_parser.add_argument("--skip-fan", action="store_true")
    arg_parser.add_argument("--skip-uv", action="store_true")
    args = arg_parser.parse_args()
    # if args.operator:
    #     operator = args.operator
    # elif not args.simulate:
    #     operator = input("OPERATOR name:").strip()
    # else:
    #     operator = "simulation"
    #warm_up_time = 190 #300 seconds == 5mins
    asyncio.run(_main(arg_parser.parse_args()))
