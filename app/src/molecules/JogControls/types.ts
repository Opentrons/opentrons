import { HORIZONTAL_PLANE, VERTICAL_PLANE } from './constants'

export type Axis = 'x' | 'y' | 'z'
export type Sign = -1 | 1
export type StepSize = number

// TODO: bc(2020-12-14) instead of three params, prefer single vector
// param e.g. [0,0,-0.1]. All Instance of JogVector currently translate to vector
// except Labware Calibration. Once Labware Calibration is updated, update this
// type and remove it's constituent types (Axis, Sign, StepSize)
export type Jog = (axis: Axis, direction: Sign, step: StepSize) => unknown

export type Plane = typeof HORIZONTAL_PLANE | typeof VERTICAL_PLANE
export type Bearing = 'left' | 'right' | 'forward' | 'back' | 'up' | 'down'
