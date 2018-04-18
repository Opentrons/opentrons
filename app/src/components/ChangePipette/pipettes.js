// @flow
// TODO(mc, 2018-04-05): pull from external pipettes library
import type {Pipette} from './types'

const pipettes: Array<Pipette> = [
  {model: 'p10_single_v1', name: 'Single-Channel P10', channels: '1'},
  {model: 'p50_single_v1', name: 'Single-Channel P50', channels: '1'},
  {model: 'p300_single_v1', name: 'Single-Channel P300', channels: '1'},
  {model: 'p1000_single_v1', name: 'Single-Channel P1000', channels: '1'},
  {model: 'p10_multi_v1', name: '8-Channel P10', channels: '8'},
  {model: 'p50_multi_v1', name: '8-Channel P50', channels: '8'},
  {model: 'p300_multi_v1', name: '8-Channel P300', channels: '8'}
]

export default pipettes
