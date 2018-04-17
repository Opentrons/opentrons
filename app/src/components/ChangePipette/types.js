// @flow
import type {Mount} from '../../robot'

import type {
  RobotMoveState,
  RobotHome,
  PipettesResponse
} from '../../http-api-client'

import type {PipetteSelectionProps} from './PipetteSelection'

export type Model =
  | 'p10_single_v1'
  | 'p50_single_v1'
  | 'p300_single_v1'
  | 'p1000_single_v1'
  | 'p10_multi_v1'
  | 'p50_multi_v1'
  | 'p300_multi_v1'

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
