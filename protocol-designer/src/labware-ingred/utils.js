// @flow
import {humanizeLabwareType} from '@opentrons/components'
import type {DisplayLabware} from './types'

export const labwareToDisplayName = (
  displayLabware: ?DisplayLabware,
  labwareType: string
) => {
  const disambiguationNumber = displayLabware ? displayLabware.disambiguationNumber : ''
  return (displayLabware && displayLabware.nickname) ||
  `${humanizeLabwareType(labwareType)} (${disambiguationNumber})`
}
