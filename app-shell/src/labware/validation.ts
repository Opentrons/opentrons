import Ajv from 'ajv'
import sortBy from 'lodash/sortBy'

import {
  getLabwareDefIsStandard,
  labwareSchemaV2,
  labwareSchemaV3,
  validateCustomLabwareHelper,
} from '@opentrons/shared-data'

import {
  DUPLICATE_LABWARE_FILE,
  INVALID_LABWARE_FILE,
  OPENTRONS_LABWARE_FILE,
  VALID_LABWARE_FILE,
} from '../constants'
import { sameIdentity } from './compare'

import type {
  CheckedLabwareFile,
  UncheckedLabwareFile,
} from '@opentrons/app/src/redux/custom-labware/types'
import type {
  LabwareDefinition,
  LabwareDefinition3,
} from '@opentrons/shared-data'

const ajv = new Ajv()

// todo(mm, 2025-05-13): When we have ajv>=7, add a type parameter like
// `ajv.compile<LabwareDefinition>(...)` so we don't have to make our own type guards.
const ajvValidateSchema2 = ajv.compile(labwareSchemaV2 as object)
const ajvValidateSchema3 = ajv.compile(labwareSchemaV3 as object)

function isValidSchema2(data: unknown): data is LabwareDefinition {
  const result = ajvValidateSchema2(data)
  return typeof result === 'boolean' && result
}

function isValidSchema3(data: unknown): data is LabwareDefinition3 {
  const result = ajvValidateSchema3(data)
  return typeof result === 'boolean' && result
}

// TODO(mc, 2019-10-21): this code is somewhat duplicated with stuff in
// shared-data, but the shared-data validation function isn't geared towards
// this use case because it either throws or passes invalid files; align them
function validateLabwareDefinition(data: unknown): LabwareDefinition | null {
  const schemaVersion = safeGetSchemaVersion(data)
  if (schemaVersion === 3) {
    return isValidSchema3(data) ? data : null
  } else if (schemaVersion === 2) {
    return isValidSchema2(data) ? data : null
  } else return null
}

function safeGetSchemaVersion(maybeLabwareDefinition: unknown): number | null {
  const maybeSchemaVersion: unknown = (maybeLabwareDefinition as any)
    ?.schemaVersion
  if (typeof maybeSchemaVersion === 'number') return maybeSchemaVersion
  return null
}

// validate a collection of unchecked labware files
export function validateLabwareFiles(
  files: UncheckedLabwareFile[]
): CheckedLabwareFile[] {
  const validated = files.map<CheckedLabwareFile>(file => {
    const { filename, data, modified } = file
    // check file against the schema
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    const definition = data && validateLabwareDefinition(data)

    const hasValidWellInfo = validateCustomLabwareHelper(definition)

    if (definition === null || !hasValidWellInfo) {
      return { filename, modified, type: INVALID_LABWARE_FILE }
    }

    const props = { filename, modified, definition }

    return getLabwareDefIsStandard(definition)
      ? { ...props, type: OPENTRONS_LABWARE_FILE }
      : { ...props, type: VALID_LABWARE_FILE }
  })

  return validated.map(v => {
    if (v.type === VALID_LABWARE_FILE) {
      const { type, ...props } = v

      // check for duplicates
      const duplicates = validated.filter(other => sameIdentity(v, other))

      // if there are duplicates and this labware isn't the oldest one
      // mark it as a duplicate
      if (duplicates.length > 1 && sortBy(duplicates, 'modified')[0] !== v) {
        return { type: DUPLICATE_LABWARE_FILE, ...props }
      }
    }
    return v
  })
}

// validate a new unchecked file against a collection of already checked files
export function validateNewLabwareFile(
  existing: CheckedLabwareFile[],
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
