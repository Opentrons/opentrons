// @flow

export type DeckCheckStep =
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

export type DeckCheckSessionData = {|
  instruments: { [string]: string },
  currentStep: DeckCheckStep,
  nextSteps: {
    links: { [DeckCheckStep]: string },
  },
  sessionToken: string,
|}
