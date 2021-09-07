// HACK: IL 2019-11-25 this file is copied from Run App
import groupBy from 'lodash/groupBy'
import type {
  LabwareDefinition1,
  LabwareDefinition2,
} from '@opentrons/shared-data'

// require all definitions in the labware/definitions/1 directory
const labwareSchemaV1DefsContext = require.context(
  '@opentrons/shared-data/labware/definitions/1',
  true, // traverse subdirectories
  /\.json$/, // import filter
  'sync' // load every definition into one synchronous chunk
)
let labwareSchemaV1Defs: Readonly<LabwareDefinition1[]> | null = null
function getLegacyLabwareDefs(): Readonly<LabwareDefinition1[]> {
  if (!labwareSchemaV1Defs) {
    labwareSchemaV1Defs = labwareSchemaV1DefsContext
      .keys()
      .map(name => labwareSchemaV1DefsContext(name))
  }

  return labwareSchemaV1Defs
}

export function getLegacyLabwareDef(
  loadName: string | null | undefined
): LabwareDefinition1 | null {
  const def = getLegacyLabwareDefs().find(d => d.metadata.name === loadName)
  return def || null
}

// require all definitions in the labware/definitions/2 directory
const labwareSchemaV2DefsContext = require.context(
  '@opentrons/shared-data/labware/definitions/2',
  true, // traverse subdirectories
  /\.json$/, // import filter
  'sync' // load every definition into one synchronous chunk
)

let labwareSchemaV2Defs: Readonly<LabwareDefinition2[]> | null = null
function getLatestLabwareDefs(): Readonly<LabwareDefinition2[]> {
  // NOTE: unlike labware-library, no filtering out "do not list labware"
  // also, more convenient & performant to make a map {loadName: def} not an array
  if (!labwareSchemaV2Defs) {
    const allDefs = labwareSchemaV2DefsContext
      .keys()
      .map(name => labwareSchemaV2DefsContext(name))
    // group by namespace + loadName
    const labwareDefGroups: {
      [groupKey: string]: LabwareDefinition2[]
    } = groupBy(allDefs, d => `${d.namespace}/${d.parameters.loadName}`)

    labwareSchemaV2Defs = Object.keys(labwareDefGroups).map(
      (groupKey: string) => {
        const group = labwareDefGroups[groupKey]
        const allVersions = group.map(d => d.version)
        const highestVersionNum = Math.max(...allVersions)
        const resultIdx = group.findIndex(d => d.version === highestVersionNum)
        return group[resultIdx]
      }
    )
  }

  return labwareSchemaV2Defs
}

export function getLatestLabwareDef(
  loadName: string | null | undefined
): LabwareDefinition2 | null {
  const def = getLatestLabwareDefs().find(
    d => d.parameters.loadName === loadName
  )
  return def || null
}
