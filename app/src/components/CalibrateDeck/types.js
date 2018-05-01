// @flow
import type {RobotMoveState} from '../../http-api-client'

export type CalibrateDeckProps = {
  title: string,
  subtitle: string,
  parentUrl: string,
  baseUrl: string,
  confirmUrl: string,
  exitUrl: string,
  moveRequest: RobotMoveState,
  moveToFront: () => mixed,
  back: () => mixed,
}
