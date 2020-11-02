// @flow

import type { JogAxis, JogDirection, JogStep } from '../../http-api-client'
import typeof { HORIZONTAL_PLANE, VERTICAL_PLANE } from './constants'

export type { JogAxis as Axis, JogDirection as Sign, JogStep as StepSize }

export type Jog = (
  axis: JogAxis,
  direction: JogDirection,
  step: JogStep
) => mixed

export type Plane = HORIZONTAL_PLANE | VERTICAL_PLANE
export type Bearing = 'left' | 'right' | 'forward' | 'back' | 'up' | 'down'
