// @flow
import type { Pipette } from '../../robot'

export type TipProbeProps = {|
  ...$Exact<Pipette>,
  confirmTipProbeUrl: string,
|}
