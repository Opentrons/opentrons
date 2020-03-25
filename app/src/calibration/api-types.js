// @flow

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
  sessionToken: string,
|}
