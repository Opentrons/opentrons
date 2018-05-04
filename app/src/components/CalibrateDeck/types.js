// @flow
import type {PipetteConfig} from '@opentrons/labware-definitions'
import type {RobotService} from '../../robot'
import type {RobotMoveState, DeckCalStartState} from '../../http-api-client'

export type CalibrationStep = 2 | 3 | 4 | 5

export type OP = {
  title: string,
  subtitle: string,
  robot: RobotService,
  parentUrl: string,
  baseUrl: string,
  exitUrl: string,
  calibrationStep: CalibrationStep
}

export type SP = {
  pipette: ?PipetteConfig,
  startRequest: DeckCalStartState,
  moveRequest: RobotMoveState,
  currentJogDistance: number
}

export type DP = {
  makeJog: (axis: any, direction: any) => () => mixed,
  onIncrementSelect: (event: SyntheticInputEvent<>) => mixed,
}

export type CalibrateDeckProps = OP & SP & DP
