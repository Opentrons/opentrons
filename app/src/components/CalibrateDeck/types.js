// @flow
import type {PipetteConfig} from '@opentrons/labware-definitions'
import type {RobotService} from '../../robot'
import type {RobotMove, DeckCalStartState} from '../../http-api-client'
import type {JogControlsProps} from '../JogControls'

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
  moveRequest: RobotMove,
  step: $PropertyType<JogControlsProps, 'step'>,
}

export type DP = {
  forceStart: () => mixed,
  jog: $PropertyType<JogControlsProps, 'jog'>,
  onStepSelect: $PropertyType<JogControlsProps, 'onStepSelect'>,
}

export type CalibrateDeckProps = OP & SP & DP
