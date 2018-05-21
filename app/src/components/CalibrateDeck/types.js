// @flow
import type {Match} from 'react-router'
import type {PipetteConfig} from '@opentrons/shared-data'
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
  jogStep: $PropertyType<JogControlsProps, 'step'>,
  pipetteProps: ?{
    mount: Mount,
    pipette: ?PipetteConfig,
  }
}

export type DP = {
  forceStart: () => mixed,
  jog: $PropertyType<JogControlsProps, 'jog'>,
  onJogStepSelect: $PropertyType<JogControlsProps, 'onStepSelect'>,
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
