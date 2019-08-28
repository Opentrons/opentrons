// @flow
import type { Pipette } from '../../robot'

export type TipProbeProps = $Exact<Pipette>

export type TipProbeState =
  | 'unprobed'
  | 'moving-to-front'
  | 'waiting-for-tip'
  | 'probing'
  | 'waiting-for-remove-tip'
  | 'done'
