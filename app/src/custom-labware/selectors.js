// @flow
// custom labware selectors
import { createSelector } from 'reselect'

import type { State } from '../types'
import type { CheckedLabwareFile, ValidLabwareFile } from './types'

export const BAD_JSON_LABWARE_FILE: 'BAD_JSON_LABWARE_FILE' =
  'BAD_JSON_LABWARE_FILE'

export const INVALID_LABWARE_FILE: 'INVALID_LABWARE_FILE' =
  'INVALID_LABWARE_FILE'

export const DUPLICATE_LABWARE_FILE: 'DUPLICATE_LABWARE_FILE' =
  'DUPLICATE_LABWARE_FILE'

export const OPENTRONS_LABWARE_FILE: 'OPENTRONS_LABWARE_FILE' =
  'OPENTRONS_LABWARE_FILE'

export const VALID_LABWARE_FILE: 'VALID_LABWARE_FILE' = 'VALID_LABWARE_FILE'

export const getCustomLabware: State => Array<CheckedLabwareFile> = createSelector(
  state => state.labware.filenames,
  state => state.labware.filesByName,
  (filenames, filesByName) => filenames.map(name => filesByName[name])
)

export const getValidCustomLabware: State => Array<ValidLabwareFile> = createSelector(
  getCustomLabware,
  // $FlowFixMe: flow unable to do type refinements via filter
  labware => labware.filter(f => f.type === VALID_LABWARE_FILE)
)
