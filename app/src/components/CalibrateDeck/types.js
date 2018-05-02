// @flow
import type {PipetteConfig} from '@opentrons/labware-definitions'
import type {RobotService} from '../../robot'
import type {RobotMove, DeckCalStartState} from '../../http-api-client'

export type OP = {
  title: string,
  subtitle: string,
  robot: RobotService,
  parentUrl: string,
  baseUrl: string,
  exitUrl: string,
}

export type SP = {
  pipette: ?PipetteConfig,
  startRequest: DeckCalStartState,
  moveRequest: RobotMove,
}

export type DP = {
  back: () => mixed,
}

export type CalibrateDeckProps = OP & SP & DP
