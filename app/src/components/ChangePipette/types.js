// @flow
import type {PipetteConfig} from '@opentrons/labware-definitions'
import type {Mount} from '../../robot'

import type {RobotMoveState, RobotHome} from '../../http-api-client'

import type {PipetteSelectionProps} from './PipetteSelection'

export type Model =
  | 'p10_single_v1'
  | 'p50_single_v1'
  | 'p300_single_v1'
  | 'p1000_single_v1'
  | 'p10_multi_v1'
  | 'p50_multi_v1'
  | 'p300_multi_v1'

export type Direction = 'attach' | 'detach'

export type ChangePipetteProps = {
  title: string,
  subtitle: string,
  mount: Mount,
  wantedPipette: ?PipetteConfig,
  actualPipette: ?PipetteConfig,
  displayName: string,
  direction: Direction,
  success: boolean,
  parentUrl: string,
  baseUrl: string,
  confirmUrl: string,
  exitUrl: string,
  moveRequest: RobotMoveState,
  homeRequest: RobotHome,
  back: () => mixed,
  exit: () => mixed,
  moveToFront: () => mixed,
  onPipetteSelect: $PropertyType<PipetteSelectionProps, 'onChange'>,
  checkPipette: () => mixed,
  confirmPipette: () => mixed
}
