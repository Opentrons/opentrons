// @flow
import aspirate from './aspirate'
import dispense from './dispense'
import {repeatArray} from './utils'

export default function mix (pipette: string, labware: string, well: string, volume: number, times: number) {
  return repeatArray([
    aspirate({
      pipette,
      volume,
      labware,
      well
    }),
    dispense({
      pipette,
      volume,
      labware,
      well
    })
  ], times)
}
