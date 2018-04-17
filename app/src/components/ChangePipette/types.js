// @flow
import type {Mount} from '../../robot'

import type {
  RobotMoveState,
  RobotHome,
  PipettesResponse
} from '../../http-api-client'

import type {PipetteSelectionProps} from './PipetteSelection'

export type Model =
  | 'p10_single'
  | 'p50_single'
  | 'p300_single'
  | 'p1000_single'
  | 'p10_multi'
  | 'p50_multi'
  | 'p300_multi'

// TODO(mc, 2018-04-06): flow does not like numbers as object keys
export type Channels = '1' | '8'

export type Direction = 'attach' | 'detach'

export type Pipette = {
  model: Model,
  name: string,
  channels: Channels,
}

export type ChangePipetteProps = {
  title: string,
  subtitle: string,
  mount: Mount,
  pipette: ?Pipette,
  direction: Direction,
  parentUrl: string,
  baseUrl: string,
  confirmUrl: string,
  exitUrl: string,
  moveRequest: RobotMoveState,
  homeRequest: RobotHome,
  pipettes: ?PipettesResponse,
  back: () => mixed,
  exit: () => mixed,
  moveToFront: () => mixed,
  onPipetteSelect: $PropertyType<PipetteSelectionProps, 'onChange'>,
  checkPipette: () => mixed,
  confirmPipette: () => mixed
}
