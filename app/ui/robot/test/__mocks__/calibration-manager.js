// mock calibration manager
// based on api/opentrons/api/calibration.py
export default function MockCalibrationManager () {
  return {
    move_to_front: jest.fn(),
    tip_probe: jest.fn(),
    move_to: jest.fn(),
    jog: jest.fn(),
    update_container_offset: jest.fn()
  }
}
