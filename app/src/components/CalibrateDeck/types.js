// @flow
import type {Match} from 'react-router'
import type {PipetteConfig} from '@opentrons/shared-data'
import type {RobotService, Mount} from '../../robot'
import type {DeckCalCommandState, DeckCalStartState} from '../../http-api-client'
import type {Jog} from '../JogControls'

export type CalibrationStep = '1' | '2' | '3' | '4' | '5' | '6'

export type OP = {
  robot: RobotService,
  parentUrl: string,
  match: Match,
}

export type SP = {
  startRequest: DeckCalStartState,
  commandRequest: DeckCalCommandState,
  pipetteProps: ?{
    mount: Mount,
    pipette: ?PipetteConfig,
  },
}

export type DP = {
  forceStart: () => mixed,
  jog: Jog,
  exit: () => mixed,
  back: () => mixed,
}

export type CalibrateDeckProps = OP & SP & DP

export type CalibrateDeckStartedProps = CalibrateDeckProps & {
  exitUrl: string,
  mount: Mount,
  pipette: PipetteConfig,
  calibrationStep: CalibrationStep,
}
