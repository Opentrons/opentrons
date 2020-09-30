// @flow
import type { ContextRouter } from 'react-router-dom'
import type { PipetteModelSpecs } from '@opentrons/shared-data'
import type { RobotService, Mount } from '../../robot'
import type {
  DeckCalCommandState,
  DeckCalStartState,
} from '../../http-api-client'
import type { Jog } from '../JogControls'

export type CalibrationStep = '1' | '2' | '3' | '4' | '5' | '6'

export type OP = {|
  ...ContextRouter,
  robot: RobotService,
  parentUrl: string,
|}

export type SP = {|
  startRequest: DeckCalStartState,
  commandRequest: DeckCalCommandState,
  pipetteProps: ?{
    mount: Mount,
    pipette: ?PipetteModelSpecs,
  },
|}

export type DP = {|
  forceStart: () => mixed,
  jog: Jog,
  exit: () => mixed,
  exitError: () => mixed,
  back: () => mixed,
|}

export type CalibrateDeckProps = {| ...OP, ...SP, ...DP |}

export type CalibrateDeckStartedProps = {|
  ...CalibrateDeckProps,
  exitUrl: string,
  mount: Mount,
  pipette: PipetteModelSpecs,
  calibrationStep: CalibrationStep,
|}
