// @flow
import {humanizeLabwareType} from '@opentrons/components'
import type {DisplayLabware} from './types'

export const labwareToDisplayName = (
  displayLabware: DisplayLabware,
  labwareType: string
) => (
  displayLabware.nickname ||
  `${humanizeLabwareType(labwareType)} (${displayLabware.disambiguationNumber})`
)
