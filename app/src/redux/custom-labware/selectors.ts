// custom labware selectors
import sortBy from 'lodash/sortBy'
import { createSelector } from 'reselect'

import { getIsTiprack } from '@opentrons/shared-data'

import { getConfig } from '../config'

import type { LabwareDefinition } from '@opentrons/shared-data'
import type { State } from '../types'
import type {
  CheckedLabwareFile,
  FailedLabwareFile,
  ValidLabwareFile,
} from './types'

export const INVALID_LABWARE_FILE: 'INVALID_LABWARE_FILE' =
  'INVALID_LABWARE_FILE'

export const DUPLICATE_LABWARE_FILE: 'DUPLICATE_LABWARE_FILE' =
  'DUPLICATE_LABWARE_FILE'

export const OPENTRONS_LABWARE_FILE: 'OPENTRONS_LABWARE_FILE' =
  'OPENTRONS_LABWARE_FILE'

export const VALID_LABWARE_FILE: 'VALID_LABWARE_FILE' = 'VALID_LABWARE_FILE'

const _getFileBaseName = (filePath: string): string => {
  return filePath.split('/').reverse()[0]
}

export const getCustomLabwareDirectory: (state: State) => string =
  createSelector(getConfig, config => config?.labware.directory ?? '')

//  @ts-expect-error(sa, 2021-05-11): TODO filesByName[name] might be undefined because filesByName is typed as a partial type
export const getCustomLabware: (state: State) => CheckedLabwareFile[] =
  createSelector(
    (state: State) => state.labware.filenames,
    (state: State) => state.labware.filesByName,
    (filenames, filesByName) =>
      sortBy(
        filenames.map(name => filesByName[name]),
        [
          'definition.metadata.displayCategory',
          'definition.metadata.displayName',
        ]
      )
  )

export const getValidCustomLabware: (state: State) => ValidLabwareFile[] =
  createSelector(getCustomLabware, labware =>
    labware.filter((f): f is ValidLabwareFile => f.type === VALID_LABWARE_FILE)
  )

export const getValidCustomLabwareFiles: (state: State) => File[] =
  createSelector(getValidCustomLabware, labware => {
    const labwareFiles = labware.map(lw => {
      const jsonDefinition = JSON.stringify(lw.definition)
      return new File([jsonDefinition], _getFileBaseName(lw.filename))
    })
    return labwareFiles
  })

export const getAddLabwareFailure: (state: State) => {
  file: FailedLabwareFile | null
  errorMessage: string | null
} = createSelector(
  state => state.labware.addFailureFile,
  state => state.labware.addFailureMessage,
  (file, errorMessage) => ({ file, errorMessage })
)

export const getAddNewLabwareName: (state: State) => {
  filename: string | null
} = createSelector(
  state => state.labware.newLabwareName,
  filename => ({ filename })
)

export const getListLabwareErrorMessage = (state: State): null | string =>
  state.labware.listFailureMessage

export const getCustomLabwareDefinitions: (
  state: State
) => LabwareDefinition[] = createSelector(getValidCustomLabware, labware =>
  labware.map(lw => lw.definition)
)

export const getCustomTipRackDefinitions: (
  state: State
) => LabwareDefinition[] = createSelector(
  getCustomLabwareDefinitions,
  labware => labware.filter(lw => getIsTiprack(lw))
)
