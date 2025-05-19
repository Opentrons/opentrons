from opentrons import protocol_api
import numpy as np
from typing import cast
from opentrons.hardware_control.modules import AbstractModule
import time

# metadata
metadata = {
    'protocolName': 'Absorbance Plate Reader Reference Plate QC V1.0.9',
    'author': 'Joe Crabtree',
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.22",
}


def convert_read_dictionary_to_array(read_data):
    """Convert a dictionary of read results to an array
    
    Converts a dictionary of OD values, as formatted by the Opentrons API's
    plate reader read() function, to a 2D numpy.array of shape (8,12) for 
    further processing.
    
    read_data: dict
        a dictonary of read values with celll numbers for keys, e.g. 'A1'
    """
    data = np.empty((8,12))
    for key, value in read_data.items():
        row_index = ord(key[0]) - ord('A')
        column_index = int(key[1:]) - 1
        data[row_index][column_index] = value

    return data
    

def check_plate_reader_accuracy(read_data, flipped=False):
    """Check the accuracy of a measurement result returned by the read() method
    
    data: dictionary of plate reader absorbance valurs
        as returned by the absorbanceReaderV1 read() method
    flipped: bool
        True if reference plate was rotated 180 degrees for measurment
    """
    
    # These are the hard-coded calibration values for Hellma 666-R013 with Serial
    # Number 101934. If you're using a different reference plate you must update
    # these values with the ones provided by Hellma with your reference plate 
    # cal_values_450nm = np.array([
        # [0.    , 0.    , 0.245 , 0.245 , 0.4973, 0.4973, 0.9897, 0.9897, 1.5258, 1.5258, 2.537 , 2.537 ],
        # [0.    , 0.    , 0.2451, 0.2451, 0.4972, 0.4972, 0.9877, 0.9877, 1.5253, 1.5253, 2.535 , 2.535 ],
        # [0.    , 0.    , 0.2451, 0.2451, 0.4973, 0.4973, 0.9871, 0.9871, 1.5246, 1.5246, 2.536 , 2.536 ],
        # [0.    , 0.    , 0.2452, 0.2452, 0.4974, 0.4974, 0.9872, 0.9872, 1.525 , 1.525 , 2.535 , 2.535 ],
        # [0.    , 0.    , 0.2452, 0.2452, 0.4976, 0.4976, 0.9872, 0.9872, 1.5248, 1.5248, 2.535 , 2.535 ],
        # [0.    , 0.    , 0.2454, 0.2454, 0.4977, 0.4977, 0.9874, 0.9874, 1.5245, 1.5245, 2.536 , 2.536 ],
        # [0.    , 0.    , 0.2453, 0.2453, 0.4977, 0.4977, 0.9876, 0.9876, 1.5245, 1.5245, 2.533 , 2.533 ],
        # [0.    , 0.    , 0.2456, 0.2456, 0.4977, 0.4977, 0.9891, 0.9891, 1.5243, 1.5243, 2.533 , 2.533 ]
    # ])
    # cal_values_650nm = np.array([
        # [0.    , 0.    , 0.2958, 0.2958, 0.5537, 0.5537, 0.9944, 0.9944, 1.4232, 1.4232, 2.372 , 2.372 ],
        # [0.    , 0.    , 0.296 , 0.296 , 0.5535, 0.5535, 0.9924, 0.9924, 1.4235, 1.4235, 2.37  , 2.37  ],
        # [0.    , 0.    , 0.296 , 0.296 , 0.5534, 0.5534, 0.9919, 0.9919, 1.4228, 1.4228, 2.37  , 2.37  ],
        # [0.    , 0.    , 0.2961, 0.2961, 0.5534, 0.5534, 0.9918, 0.9918, 1.423 , 1.423 , 2.369 , 2.369 ],
        # [0.    , 0.    , 0.2962, 0.2962, 0.5536, 0.5536, 0.9918, 0.9918, 1.4225, 1.4225, 2.369 , 2.369 ],
        # [0.    , 0.    , 0.2964, 0.2964, 0.5535, 0.5535, 0.992 , 0.992 , 1.4223, 1.4223, 2.369 , 2.369 ],
        # [0.    , 0.    , 0.2963, 0.2963, 0.5534, 0.5534, 0.9922, 0.9922, 1.4221, 1.4221, 2.368 , 2.368 ],
        # [0.    , 0.    , 0.2965, 0.2965, 0.5533, 0.5533, 0.9938, 0.9938, 1.4222, 1.4222, 2.367 , 2.367 ]
    # ])
    
    # These are the hard-coded calibration values for Hellma 666-R013 with Serial
    # Number 102934. If you're using a different reference plate you must update
    # these values with the ones provided by Hellma with your reference plate 
    cal_values_450nm = np.array([
        [0.    , 0.    , 0.2437, 0.2437, 0.4877, 0.4877, 1.0014, 1.0014, 1.529 , 1.529 , 2.533 , 2.533 ],
        [0.    , 0.    , 0.2437, 0.2437, 0.4881, 0.4881, 1.0012, 1.0012, 1.5293, 1.5293, 2.532 , 2.532 ],
        [0.    , 0.    , 0.2436, 0.2436, 0.4887, 0.4887, 1.0012, 1.0012, 1.529 , 1.529 , 2.532 , 2.532 ],
        [0.    , 0.    , 0.2436, 0.2436, 0.4894, 0.4894, 1.0012, 1.0012, 1.5294, 1.5294, 2.532 , 2.532 ],
        [0.    , 0.    , 0.2435, 0.2435, 0.4896, 0.4896, 1.0011, 1.0011, 1.5301, 1.5301, 2.532 , 2.532 ],
        [0.    , 0.    , 0.2434, 0.2434, 0.4896, 0.4896, 1.0012, 1.0012, 1.5307, 1.5307, 2.531 , 2.531 ],
        [0.    , 0.    , 0.2435, 0.2435, 0.4897, 0.4897, 1.0011, 1.0011, 1.5311, 1.5311, 2.53  , 2.53  ],
        [0.    , 0.    , 0.2436, 0.2436, 0.4893, 0.4893, 1.001 , 1.001 , 1.5303, 1.5303, 2.531 , 2.531 ]
    ])
    cal_values_650nm = np.array([
        [0.    , 0.    , 0.2974, 0.2974, 0.5659, 0.5659, 1.0057, 1.0057, 1.4277, 1.4277, 2.366 , 2.366 ],
        [0.    , 0.    , 0.2974, 0.2974, 0.5665, 0.5665, 1.0056, 1.0056, 1.4276, 1.4276, 2.366 , 2.366 ],
        [0.    , 0.    , 0.2971, 0.2971, 0.5671, 0.5671, 1.0056, 1.0056, 1.4276, 1.4276, 2.365 , 2.365 ],
        [0.    , 0.    , 0.2971, 0.2971, 0.5678, 0.5678, 1.0057, 1.0057, 1.4277, 1.4277, 2.365 , 2.365 ],
        [0.    , 0.    , 0.2969, 0.2969, 0.5681, 0.5681, 1.0055, 1.0055, 1.4287, 1.4287, 2.365 , 2.365 ],
        [0.    , 0.    , 0.2968, 0.2968, 0.568 , 0.568 , 1.0057, 1.0057, 1.4291, 1.4291, 2.365 , 2.365 ],
        [0.    , 0.    , 0.2968, 0.2968, 0.568 , 0.568 , 1.0056, 1.0056, 1.4293, 1.4293, 2.364 , 2.364 ],
        [0.    , 0.    , 0.2969, 0.2969, 0.5675, 0.5675, 1.0054, 1.0054, 1.4285, 1.4285, 2.365 , 2.365 ]
    ])
    
    cal_tolerances = np.array(
        [0.    , 0.    , 0.0024, 0.0024, 0.0034, 0.0034, 0.0034, 0.0034, 0.0068, 0.0068, 0.012 , 0.012 ]
    )
    
    # Calculate absolute accuracy tolerances for each cell
    # The last two columns have a higher tolerance per the Byonoy datasheet
    #   because OD>2.0 and wavelength>=450nm on the Hellma plate
    accuracy_tolerances_450nm = np.zeros((8,12))
    accuracy_tolerances_450nm[:,:10] = cal_values_450nm[:,:10]*0.010 + cal_tolerances[:10] + 0.01
    accuracy_tolerances_450nm[:,10:] = cal_values_450nm[:,10:]*0.015 + cal_tolerances[10:] + 0.01
    accuracy_tolerances_650nm = np.zeros((8,12))
    accuracy_tolerances_650nm[:,:10] = cal_values_650nm[:,:10]*0.010 + cal_tolerances[:10] + 0.01
    accuracy_tolerances_650nm[:,10:] = cal_values_650nm[:,10:]*0.015 + cal_tolerances[10:] + 0.01

    # Convert read result dictionary to numpy array for comparison
    data_450nm = convert_read_dictionary_to_array(read_data[450])
    data_650nm = convert_read_dictionary_to_array(read_data[650])
        
    # Check accuracy
    if (flipped):
        within_tolerance_450nm = np.isclose(data_450nm, np.rot90(cal_values_450nm, 2), atol=np.rot90(accuracy_tolerances_450nm, 2))
        within_tolerance_650nm = np.isclose(data_650nm, np.rot90(cal_values_650nm, 2), atol=np.rot90(accuracy_tolerances_650nm, 2))
    else:
       within_tolerance_450nm = np.isclose(data_450nm, cal_values_450nm, atol=accuracy_tolerances_450nm)
       within_tolerance_650nm = np.isclose(data_650nm, cal_values_650nm, atol=accuracy_tolerances_650nm)

    errors_450nm = np.count_nonzero(within_tolerance_450nm==False)
    errors_650nm = np.count_nonzero(within_tolerance_650nm==False)

    return errors_450nm, errors_650nm

# protocol run function
def run(protocol: protocol_api.ProtocolContext):
    HELLMA_PLATE_SLOT = "C2"
    PLATE_READER_SLOT = "C3"
    
    plate_reader = protocol.load_module("absorbanceReaderV1", PLATE_READER_SLOT)
    hellma_plate = protocol.load_labware("hellma_reference_plate", HELLMA_PLATE_SLOT)
    #tiprack_1000 = protocol.load_labware(load_name='opentrons_flex_96_tiprack_50ul', location="A2")
    trash_labware = protocol.load_trash_bin("A3")
    #instrument = protocol.load_instrument("flex_8channel_50", "left", tip_racks=[tiprack_1000])
    #instrument = protocol.load_instrument("flex_8channel_1000", "left", tip_racks=[tiprack_1000])
    #instrument = protocol.load_instrument("flex_96channel_1000", "left", tip_racks=[tiprack_1000])
    #instrument.trash_container = trash_labware

    # Test each plate reader with reference not rotated, then rotated
    for flipped in [False, True]:
        # Determine the plate reader serial number
        # Get the Serial + Version of the device
        hw_mod = cast(AbstractModule, protocol.robot.hardware.hardware._backend.module_controls.get_module_by_module_id(plate_reader.serial_number))
        if hw_mod:
            serial = hw_mod.device_info['serial']
            version = hw_mod.device_info['version']
            #msg = f"SERIAL: {serial}\nVERSION: {version}"
            #protocol.pause(msg=msg)
        else:
            continue
        
        # Test this particular plate reader in this reference plate rotation 5 times
        for i in range(1, 3):
            # Add time str
            current_timestamp = time.time()
            formatted_time = time.strftime("%Y-%m-%d %H_%M_%S ", time.localtime(current_timestamp))
            # Initialize to multiple wavelengths
            plate_reader.close_lid()
            plate_reader.initialize('multi', [450, 562, 600, 650])

            plate_reader.open_lid()
            protocol.move_labware(hellma_plate, plate_reader, use_gripper=True)
            plate_reader.close_lid()

            # Take reading
            orientation = "0deg" if not flipped else "180deg"
            filename = f"plate_reader_qc_{serial}_{version}_{orientation}_{i}_{formatted_time}.csv"
            result = plate_reader.read(export_filename=filename)
            msg = f"multi: {result}"
            protocol.comment(msg=msg)
            #protocol.pause(msg=msg)

            # Place the Plate Reader lid back on using the Gripper.
            plate_reader.open_lid()
            protocol.move_labware(hellma_plate, HELLMA_PLATE_SLOT, use_gripper=True)
            plate_reader.close_lid()
            
            # Check and display accuracy
            if result is not None:
                #msg = f"multi: {result}"
                #msg = f"multi: {result[450]}"
                errors_450nm, errors_650nm = check_plate_reader_accuracy(result, flipped=flipped)
                if errors_450nm > 0 or errors_650nm > 0:
                    msg = f"{serial} {orientation} Run {i}\n450nm Failures: {errors_450nm}\n650nm Failures: {errors_650nm}"
                    protocol.comment(msg=msg)
                else:
                    msg = f"{serial} run {i} passed."
                protocol.pause(msg=msg)

                
                if i == 6:
                    msg = f"Testing of {serial} in this plate orientation complete."
                    protocol.comment(msg=msg)
                    protocol.pause(msg=msg)

        if not flipped:
            msg = "Rotate the reference plate and continue." 
        else:
            msg = "Test Complete."
        protocol.comment(msg=msg)
        protocol.pause(msg=msg)
