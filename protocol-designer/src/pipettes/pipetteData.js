// @flow
import type {Channels} from '@opentrons/components'

// TODO: Ian 2018-06-22 use shared-data
export const pipetteDataByName: {[pipetteName: string]: {maxVolume: number, channels: Channels}} = {
  'P10 Single-Channel': {
    maxVolume: 10,
    channels: 1
  },
  'P10 8-Channel': {
    maxVolume: 10,
    channels: 8
  },
  'P50 Single-Channel': {
    maxVolume: 50,
    channels: 1
  },
  'P50 8-Channel': {
    maxVolume: 50,
    channels: 8
  },
  'P300 Single-Channel': {
    maxVolume: 300,
    channels: 1
  },
  'P300 8-Channel': {
    maxVolume: 300,
    channels: 8
  },
  'P1000 Single-Channel': {
    maxVolume: 1000,
    channels: 1
  }
}

export type PipetteName = $Keys<typeof pipetteDataByName>

export const pipetteOptions = [
  'P10 Single-Channel',
  'P10 8-Channel',
  'P50 Single-Channel',
  'P50 8-Channel',
  'P300 Single-Channel',
  'P300 8-Channel',
  'P1000 Single-Channel'
].map(
  (name: string) => ({name, value: name})
)
