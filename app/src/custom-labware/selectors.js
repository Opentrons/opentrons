// @flow
// custom labware selectors
import { createSelector } from 'reselect'
import sortBy from 'lodash/sortBy'

import { getConfig } from '../config'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { State } from '../types'
import type {
  CheckedLabwareFile,
  ValidLabwareFile,
  FailedLabwareFile,
} from './types'

export const INVALID_LABWARE_FILE: 'INVALID_LABWARE_FILE' =
  'INVALID_LABWARE_FILE'

export const DUPLICATE_LABWARE_FILE: 'DUPLICATE_LABWARE_FILE' =
  'DUPLICATE_LABWARE_FILE'

export const OPENTRONS_LABWARE_FILE: 'OPENTRONS_LABWARE_FILE' =
  'OPENTRONS_LABWARE_FILE'

export const VALID_LABWARE_FILE: 'VALID_LABWARE_FILE' = 'VALID_LABWARE_FILE'

export const getCustomLabwareDirectory: State => string = createSelector(
  getConfig,
  config => config.labware.directory
)

export const getCustomLabware: State => Array<CheckedLabwareFile> = createSelector(
  state => state.labware.filenames,
  state => state.labware.filesByName,
  (filenames, filesByName) =>
    sortBy(filenames.map(name => filesByName[name]), [
      'definition.metadata.displayCategory',
      'definition.metadata.displayName',
    ])
)

export const getValidCustomLabware: State => Array<ValidLabwareFile> = createSelector(
  getCustomLabware,
  // $FlowFixMe: flow unable to do type refinements via filter
  labware => labware.filter(f => f.type === VALID_LABWARE_FILE)
)

export const getAddLabwareFailure: State => {|
  file: FailedLabwareFile | null,
  errorMessage: string | null,
|} = createSelector(
  state => state.labware.addFailureFile,
  state => state.labware.addFailureMessage,
  (file, errorMessage) => ({ file, errorMessage })
)

export const getListLabwareErrorMessage = (state: State) =>
  state.labware.listFailureMessage

export const getCustomLabwareDefinitions: State => Array<LabwareDefinition2> = createSelector(
  getValidCustomLabware,
  labware => labware.map(lw => lw.definition)
)
