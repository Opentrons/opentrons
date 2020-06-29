// @flow
// HACK: IL 2019-11-25 this file is copied from Run App
import type {
  LabwareDefinition1,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import groupBy from 'lodash/groupBy'

// require all definitions in the labware/definitions/1 directory
// require.context is webpack-specific method
const labwareSchemaV1DefsContext = (require: any).context(
  '@opentrons/shared-data/labware/definitions/1',
  true, // traverse subdirectories
  /\.json$/, // import filter
  'sync' // load every definition into one synchronous chunk
)
let labwareSchemaV1Defs: $ReadOnlyArray<LabwareDefinition1> | null = null
function getLegacyLabwareDefs(): $ReadOnlyArray<LabwareDefinition1> {
  if (!labwareSchemaV1Defs) {
    labwareSchemaV1Defs = labwareSchemaV1DefsContext
      .keys()
      .map(name => labwareSchemaV1DefsContext(name))
  }

  return labwareSchemaV1Defs
}

export function getLegacyLabwareDef(
  loadName: ?string
): LabwareDefinition1 | null {
  const def = getLegacyLabwareDefs().find(d => d.metadata.name === loadName)
  return def || null
}

// require all definitions in the labware/definitions/2 directory
// require.context is webpack-specific method
const labwareSchemaV2DefsContext = (require: any).context(
  '@opentrons/shared-data/labware/definitions/2',
  true, // traverse subdirectories
  /\.json$/, // import filter
  'sync' // load every definition into one synchronous chunk
)

let labwareSchemaV2Defs: $ReadOnlyArray<LabwareDefinition2> | null = null
function getLatestLabwareDefs(): $ReadOnlyArray<LabwareDefinition2> {
  // NOTE: unlike labware-library, no filtering out "do not list labware"
  // also, more convenient & performant to make a map {loadName: def} not an array
  if (!labwareSchemaV2Defs) {
    const allDefs = labwareSchemaV2DefsContext
      .keys()
      .map(name => labwareSchemaV2DefsContext(name))
    // group by namespace + loadName
    const labwareDefGroups: {
      [groupKey: string]: Array<LabwareDefinition2>,
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
  loadName: ?string
): LabwareDefinition2 | null {
  const def = getLatestLabwareDefs().find(
    d => d.parameters.loadName === loadName
  )
  return def || null
}
