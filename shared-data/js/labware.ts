import fixture12Trough from '../labware/fixtures/2/fixture_12_trough.json'
import fixture24Tuberack from '../labware/fixtures/2/fixture_24_tuberack.json'
import fixture96Plate from '../labware/fixtures/2/fixture_96_plate.json'
import fixture384Plate from '../labware/fixtures/2/fixture_384_plate.json'
import fixtureCalibrationBlock from '../labware/fixtures/2/fixture_calibration_block.json'
import fixtureTiprack1000ul from '../labware/fixtures/2/fixture_flex_96_tiprack_1000ul.json'
import fixtureTiprackAdapter from '../labware/fixtures/2/fixture_flex_96_tiprack_adapter.json'
import fixtureTiprack10ul from '../labware/fixtures/2/fixture_tiprack_10_ul.json'
import fixtureTiprack300ul from '../labware/fixtures/2/fixture_tiprack_300_ul.json'
import fixtureTrash from '../labware/fixtures/2/fixture_trash.json'
import labwareSchemaV2 from '../labware/schemas/2.json'
import labwareSchemaV3 from '../labware/schemas/3.json'

import type {
  LabwareDef2ByDefURI,
  LabwareDefinition,
  LabwareDefinition1,
  LabwareDefinition2,
  LabwareDefinition3,
  LegacyLabwareDefByName,
} from './types'

// todo(mm, 2025-03-04): This duplicates getLabwareDefUri() in ./helpers. We should use
// that instead, but using it gives me obscure "TypeError: getLabwareDefURI is not a function"
// errors in certain test files. Some kind of circular dependency problem? Some kind of
// mocking problem?
function getLabwareDefURI(def: LabwareDefinition): string {
  return `${def.namespace}/${def.parameters.loadName}/${def.version}`
}

const schema1DefinitionsByPath: Record<
  string,
  LabwareDefinition1
> = import.meta.glob('../labware/definitions/1/*.json', {
  eager: true,
  import: 'default',
})
const schema2DefinitionsByPath: Record<
  string,
  LabwareDefinition2
> = import.meta.glob('../labware/definitions/2/*/*.json', {
  eager: true,
  import: 'default',
})
const schema3DefinitionsByPath: Record<
  string,
  LabwareDefinition3
> = import.meta.glob('../labware/definitions/3/*/*.json', {
  eager: true,
  import: 'default',
})

const schema1DefinitionsByName = Object.fromEntries(
  Object.values(schema1DefinitionsByPath).map(def => [def.metadata.name, def])
)
const schema2DefinitionsByURI = Object.fromEntries(
  Object.values(schema2DefinitionsByPath).map(def => [
    getLabwareDefURI(def),
    def,
  ])
)
// todo(mm, 2025-02-27): getAllDefinitions() should include this.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const schema3DefinitionsByURI = Object.fromEntries(
  Object.values(schema3DefinitionsByPath).map(def => [
    getLabwareDefURI(def),
    def,
  ])
)

// todo(mm, 2025-02-27): When calling code is ready, this should probably include
// schema 3 definitions, not just schema 2 definitions.
//
// todo(mm, 2025-02-27): The only remaining difference between this and
// getAllDefinitions() is that getAllDefinitions() has potentially dangerous caching
// behavior (see the todo comment there). Delete this in favor of getAllDefinitions()
// when that's resolved.
export const getAllLabwareDefs = (): Record<string, LabwareDefinition2> =>
  schema2DefinitionsByURI

let _definitions: LabwareDef2ByDefURI | null = null
export function getAllDefinitions(
  blockList: string[] = []
): LabwareDef2ByDefURI {
  // todo(mm, 2025-02-27): This looks suspicious: if we're called twice with two
  // different blockList values, we'll return the same results for both.
  if (_definitions == null) {
    _definitions = Object.values(
      getAllLabwareDefs()
    ).reduce<LabwareDef2ByDefURI>((acc, labwareDef: LabwareDefinition2) => {
      const labwareDefURI = getLabwareDefURI(labwareDef)
      return blockList.includes(labwareDef.parameters.loadName)
        ? acc
        : { ...acc, [labwareDefURI]: labwareDef }
    }, {})
  }

  return _definitions
}

export function getAllLegacyDefinitions(): LegacyLabwareDefByName {
  return schema1DefinitionsByName
}

// Labware Images Mapping

function getAllImages(): Record<string, string> {
  const imageModules = import.meta.glob('../labware/images/*.{png,jpg,jpeg}', {
    eager: true,
    import: 'default',
  })
  const imageKeyToUrl: Record<string, string> = {}
  for (const imgPath in imageModules) {
    const filename = imgPath.split('/').pop() ?? ''
    const base = filename.replace(/\.(png|jpe?g)$/i, '')
    const varName = base.replace(/\./g, '_').replace(/-/g, '_')
    imageKeyToUrl[varName] = imageModules[imgPath] as string
  }
  return imageKeyToUrl
}

const loadNames = Array.from(
  new Set(
    Object.keys(getAllLabwareDefs()).map(uri => {
      const parts = uri.split('/')
      return parts[1] ?? uri
    })
  )
)

function matchLoadNamestoURL(loadName: string, varName: string): boolean {
  const exactMatchOnlyLoadNames = new Set([
    'milliplex_microtiter_plate',
    'milliplex_microtiter_plate_lid',
    'ibidi_96_square_well_plate_300ul',
    'ibidi_96_square_well_plate_300ul_lid',
    'opentrons_96_deep_well_adapter',
    'opentrons_96_filtertiprack_1000ul',
    'opentrons_96_tiprack_1000ul',
    'opentrons_universal_flat_adapter',
    'opentrons_universal_flat_adapter_type_b',
  ])

  const normalizedLoadName = loadName.replace(/\./g, '_').replace(/-/g, '_')
  const loadParts = normalizedLoadName.split('_')
  const normalizedVarName = varName.replace(/\./g, '_').replace(/-/g, '_')
  const varParts = normalizedVarName.split('_')

  if (exactMatchOnlyLoadNames.has(loadName)) {
    return normalizedVarName === normalizedLoadName
  }

  function isConsecutiveSubarray(subarr: string[], arr: string[]): boolean {
    for (let i = 0; i <= arr.length - subarr.length; i++) {
      let match = true
      for (let j = 0; j < subarr.length; j++) {
        if (arr[i + j] !== subarr[j]) {
          match = false
          break
        }
      }
      if (match) return true
    }
    return false
  }

  return (
    isConsecutiveSubarray(loadParts, varParts) ||
    normalizedLoadName.includes(normalizedVarName)
  )
}
// Match images to load names
const labwareImages: Record<string, string[]> = {}
const matchedImageVars = new Set<string>()
const imageKeyToUrl = getAllImages()
for (const loadName of loadNames) {
  const matchingUrls = Object.entries(imageKeyToUrl)
    .filter(([varName]) => matchLoadNamestoURL(loadName, varName))
    .map(([varName, url]) => {
      matchedImageVars.add(varName)
      return url
    })

  if (matchingUrls.length > 0) {
    labwareImages[loadName] = matchingUrls
  }
}

// Clean up labwareImages
for (const [varName, url] of Object.entries(imageKeyToUrl)) {
  if (!matchedImageVars.has(varName)) {
    labwareImages[varName] = [url]
  }
}
const sortedLabwareImages = Object.fromEntries(
  Object.entries(labwareImages).sort(([a], [b]) => a.localeCompare(b))
)

export {
  sortedLabwareImages as labwareImages,
  labwareSchemaV2,
  labwareSchemaV3,
  fixture96Plate,
  fixture12Trough,
  fixture24Tuberack,
  fixtureTiprack10ul,
  fixtureTiprack300ul,
  fixtureTiprack1000ul,
  fixtureTiprackAdapter,
  fixtureTrash,
  fixture384Plate,
  fixtureCalibrationBlock,
}

// Legacy exports.
// todo(mm, 2025-02-27): See if calling code can access these in a way that doesn't
// require us to export labware as individual objects.
export const opentrons96PcrAdapterV1 =
  schema2DefinitionsByURI['opentrons/opentrons_96_pcr_adapter/1']
export const opentrons1Trash3200MlFixedV1 =
  schema2DefinitionsByURI['opentrons/opentrons_1_trash_3200ml_fixed/1']
export const opentrons96Tiprack10UlV1Uncasted =
  schema2DefinitionsByURI['opentrons/opentrons_96_tiprack_10ul/1']
