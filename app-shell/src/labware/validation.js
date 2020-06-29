// @flow
import {
  DUPLICATE_LABWARE_FILE,
  INVALID_LABWARE_FILE,
  OPENTRONS_LABWARE_FILE,
  VALID_LABWARE_FILE,
} from '@opentrons/app/src/custom-labware/selectors'
import type {
  CheckedLabwareFile,
  OpentronsLabwareFile,
  UncheckedLabwareFile,
  ValidLabwareFile,
} from '@opentrons/app/src/custom-labware/types'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import labwareSchema from '@opentrons/shared-data/labware/schemas/2.json'
import Ajv from 'ajv'
import sortBy from 'lodash/sortBy'

import { sameIdentity } from './compare'

const ajv = new Ajv()
const validateDefinition = ajv.compile(labwareSchema)

// TODO(mc, 2019-10-21): this code is somewhat duplicated with stuff in
// shared-data, but the shared-data validation function isn't geared towards
// this use case because it either throws or passes invalid files; align them
const validateLabwareDefinition = (data: any): LabwareDefinition2 | null =>
  validateDefinition(data) ? data : null

// validate a collection of unchecked labware files
export function validateLabwareFiles(
  files: Array<UncheckedLabwareFile>
): Array<CheckedLabwareFile> {
  const validated = files.map<CheckedLabwareFile>(file => {
    const { filename, data, created } = file

    // check file against the schema
    const definition = data && validateLabwareDefinition(data)

    if (definition === null) {
      return { filename, created, type: INVALID_LABWARE_FILE }
    }

    const props = { filename, created, definition }

    return definition.namespace !== 'opentrons'
      ? ({ ...props, type: VALID_LABWARE_FILE }: ValidLabwareFile)
      : ({ ...props, type: OPENTRONS_LABWARE_FILE }: OpentronsLabwareFile)
  })

  return validated.map(v => {
    if (v.type === VALID_LABWARE_FILE) {
      const { type, ...props } = v

      // check for duplicates
      const duplicates = validated.filter(other => sameIdentity(v, other))

      // if there are duplicates and this labware isn't the oldest one
      // mark it as a duplicate
      if (duplicates.length > 1 && sortBy(duplicates, 'created')[0] !== v) {
        return { type: DUPLICATE_LABWARE_FILE, ...props }
      }
    }

    return v
  })
}

// validate a new unchecked file against a collection of already checked files
export function validateNewLabwareFile(
  existing: Array<CheckedLabwareFile>,
  newFile: UncheckedLabwareFile
): CheckedLabwareFile {
  const [checkedNewFile] = validateLabwareFiles([newFile])

  if (
    checkedNewFile.type === VALID_LABWARE_FILE &&
    existing.some(e => sameIdentity(checkedNewFile, e))
  ) {
    const { type, ...props } = checkedNewFile
    return { type: DUPLICATE_LABWARE_FILE, ...props }
  }

  return checkedNewFile
}
