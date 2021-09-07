// mock calibration manager
// based on api/opentrons/api/calibration.py
export function MockCalibrationManager() {
  return {
    pick_up_tip: jest.fn(),
    drop_tip: jest.fn(),
    home: jest.fn(),
    move_to_front: jest.fn(),
    tip_probe: jest.fn(),
    move_to: jest.fn(),
    jog: jest.fn(),
    update_container_offset: jest.fn(),
  }
}
