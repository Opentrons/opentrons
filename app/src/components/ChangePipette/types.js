// @flow
import type {
  PipetteNameSpecs,
  PipetteModelSpecs,
  PipetteDisplayCategory,
} from '@opentrons/shared-data'

import type { Mount } from '../../robot'
import type { Robot } from '../../discovery'
import type { RobotMove, RobotHome } from '../../http-api-client'
import type { PipetteSelectionProps } from './PipetteSelection'

export type Direction = 'attach' | 'detach'

export type ChangePipetteProps = {|
  title: string,
  subtitle: string,
  mount: Mount,
  wantedPipette: ?PipetteNameSpecs,
  actualPipette: ?PipetteModelSpecs,
  displayName: string,
  displayCategory: ?PipetteDisplayCategory,
  direction: Direction,
  success: boolean,
  attachedWrong: boolean,
  parentUrl: string,
  baseUrl: string,
  confirmUrl: string,
  exitUrl: string,
  moveRequest: RobotMove,
  homeRequest: RobotHome,
  robot: Robot,
  back: () => mixed,
  exit: () => mixed,
  setWantedName: (name: string | null) => mixed,
  moveToFront: () => mixed,
  onPipetteSelect: $PropertyType<PipetteSelectionProps, 'onPipetteChange'>,
  checkPipette: () => mixed,
  goToConfirmUrl: () => mixed,
|}
