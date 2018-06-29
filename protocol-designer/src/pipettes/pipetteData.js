// @flow
import {getPipette, getPipetteModels} from '@opentrons/shared-data'
import type {Channels} from '@opentrons/components'

// TODO: Ian 2018-06-22 use shared-data
// export const pipetteDataByName: {[pipetteName: string]: {maxVolume: number, channels: Channels}} = {
//   'P10 Single-Channel': {
//     maxVolume: 10,
//     channels: 1
//   },
//   'P10 8-Channel': {
//     maxVolume: 10,
//     channels: 8
//   },
//   'P50 Single-Channel': {
//     maxVolume: 50,
//     channels: 1
//   },
//   'P50 8-Channel': {
//     maxVolume: 50,
//     channels: 8
//   },
//   'P300 Single-Channel': {
//     maxVolume: 300,
//     channels: 1
//   },
//   'P300 8-Channel': {
//     maxVolume: 300,
//     channels: 8
//   },
//   'P1000 Single-Channel': {
//     maxVolume: 1000,
//     channels: 1
//   }
// }

export type PipetteName = any // TODO BC 2018-06-29 get type from shared-data
export const pipetteOptions = getPipetteModels().map((model: string) => {
  const pipette = getPipette(model)
  return {name: pipette.displayName, value: pipette.model}
})