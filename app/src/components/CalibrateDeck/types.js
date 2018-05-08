// @flow
import type {Match} from 'react-router'
import type {PipetteConfig} from '@opentrons/labware-definitions'
import type {RobotService, Mount} from '../../robot'
import type {RobotMove, DeckCalStartState} from '../../http-api-client'
import type {JogControlsProps} from '../JogControls'

export type CalibrationStep = '1' | '2' | '3' | '4' | '5' | '6'

export type OP = {
  robot: RobotService,
  parentUrl: string,
  match: Match,
}

export type SP = {
  startRequest: DeckCalStartState,
  moveRequest: RobotMove,
  step: $PropertyType<JogControlsProps, 'step'>,
  pipetteProps: ?{
    mount: Mount,
    pipette: ?PipetteConfig,
  }
}

export type DP = {
  forceStart: () => mixed,
  jog: $PropertyType<JogControlsProps, 'jog'>,
  onStepSelect: $PropertyType<JogControlsProps, 'onStepSelect'>,
  onContinueClick: () => mixed,
  onCancelClick: () => mixed,
  exit: () => mixed,
  back: () => mixed
}

export type CalibrateDeckProps = OP & SP & DP

export type CalibrateDeckStartedProps = CalibrateDeckProps & {
  exitUrl: string,
  mount: Mount,
  pipette: PipetteConfig,
  calibrationStep: CalibrationStep,
}
