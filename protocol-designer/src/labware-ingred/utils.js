// @flow
import {humanizeLabwareType} from '@opentrons/components'
import type {Labware} from './types'

export const labwareToDisplayName = (l: Labware) => (
  l.name || `${humanizeLabwareType(l.type)} (${l.disambiguationNumber})`
)
