// @flow
import {tiprackWellNamesFlat} from '../'

// export const wellNames96 = flatMap(
//   'ABCDEFGH'.split(''),
//   (letter): Array<string> => range(12).map(number => letter + (number + 1))
// )

// Eg {A1: true, B1: true, ...}
export const filledTiprackWells = tiprackWellNamesFlat.reduce(
  (acc, wellName) => ({...acc, [wellName]: true}),
  {}
)

export const emptyTiprackWells = tiprackWellNamesFlat.reduce(
  (acc, wellName) => ({...acc, [wellName]: false}),
  {}
)

export const p300Single = {
  id: 'p300SingleId',
  mount: 'right',
  maxVolume: 300,
  channels: 1
}

export const p300Multi = {
  id: 'p300MultiId',
  mount: 'left',
  maxVolume: 300,
  channels: 8
}
