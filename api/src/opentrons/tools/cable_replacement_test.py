from opentrons import robot

def test_pip_cable(smoothie):
    pipettes_attached = ['left', 'right']
    for mount in pipettes_attached:
        assert smoothie.read_pipette_model(mount) is not None, f'FAIL, no model {mount}'
        assert smoothie.read_pipette_id(mount) is not None, f'FAIL, no id {mount}'
    print("PASS")

def try_homing(smoothie, num):
    try:
        smoothie.update_homed_flags(
            {
                'X': True,
                'Y': True,
                'Z': False,
                'A': False,
                'B': False,
                'C': False
            })
        smoothie.home('ZABC')
    except smoothie.SmoothieError as se:
        error_axis = se.ret_code.strip()
        robot.comment(f"{error_axis} axis failed to home")
        robot.comment(f"FAIL, check wire")
    smoothie.move({'X': 150, 'Y': 150, 'Z': 80,  'A': 80})
    print(f"Homing {num} PASSED")

if __name__ == '__main__':
    robot.connect()
    smoothie = robot._driver
    test_pip_cable(smoothie)
    for val in range(2):
        try_homing(smoothie, val)
