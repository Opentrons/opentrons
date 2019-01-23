// @flow
import reduce from 'lodash/reduce'
import {humanizeLabwareType} from '@opentrons/components'
import type {Labware} from './types'
import type {ContainersState} from './reducers' // TODO IMMEDIATELY HACK

export const labwareToDisplayName = (l: Labware) => (
  l.nickname || `${humanizeLabwareType(l.type)} (${l.disambiguationNumber})`
)

export const _loadedContainersBySlot = (containers: ContainersState) =>
  reduce(containers, (acc, labware: ?Labware) => (labware && labware.slot)
    ? {...acc, [labware.slot]: labware.type}
    : acc
    , {})
