// @flow

// TODO: next BC 2020-03-31 once this enum settles,
// put the strings in constants
export type RobotCalibrationCheckStep =
  | 'sessionStart'
  | 'specifyLabware'
  | 'pickUpTip'
  | 'checkPointOne'
  | 'checkPointTwo'
  | 'checkPointThree'
  | 'checkHeight'
  | 'sessionExit'
  | 'badRobotCalibration'
  | 'noPipettesAttached'

export type RobotCalibrationCheckSessionData = {|
  instruments: { [string]: string },
  currentStep: RobotCalibrationCheckStep,
  nextSteps: {
    links: { [RobotCalibrationCheckStep]: string },
  },
|}
