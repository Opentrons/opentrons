// @flow
import type {Channels} from '@opentrons/components'

export const pipetteDataByName: {[pipetteName: string]: {maxVolume: number, channels: Channels}} = {
  'P10 Single-Channel': {
    maxVolume: 10,
    channels: 1
  },
  'P10 8-Channel': {
    maxVolume: 10,
    channels: 8
  },
  'P300 Single-Channel': {
    maxVolume: 300,
    channels: 1
  },
  'P300 8-Channel': {
    maxVolume: 300,
    channels: 8
  }
}

export type PipetteName = $Keys<typeof pipetteDataByName>

export const pipetteOptions = [
  {name: 'P10 Single-Channel', value: 'P10 Single-Channel'},
  {name: 'P10 8-Channel', value: 'P10 8-Channel'},
  {name: 'P300 Single-Channel', value: 'P300 Single-Channel'},
  {name: 'P300 8-Channel', value: 'P300 8-Channel'}
]
