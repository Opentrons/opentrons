// @flow

import type { JogAxis, JogDirection, JogStep } from '../../http-api-client'

export type { JogAxis as Axis, JogDirection as Sign, JogStep as StepSize }

export type Jog = (
  axis: JogAxis,
  direction: JogDirection,
  step: JogStep
) => mixed

export type Plane = 'horizontal' | 'vertical'
export type Bearing = 'left' | 'right' | 'forward' | 'back' | 'up' | 'down'
