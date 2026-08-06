import fixture12Trough from '../labware/fixtures/2/fixture_12_trough.json'
import fixture24Tuberack from '../labware/fixtures/2/fixture_24_tuberack.json'
import fixture96Plate from '../labware/fixtures/2/fixture_96_plate.json'
import fixture384Plate from '../labware/fixtures/2/fixture_384_plate.json'
import fixtureCalibrationBlock from '../labware/fixtures/2/fixture_calibration_block.json'
import fixtureTiprack1000ul from '../labware/fixtures/2/fixture_flex_96_tiprack_1000ul.json'
import fixtureTiprackAdapter from '../labware/fixtures/2/fixture_flex_96_tiprack_adapter.json'
import fixtureLid from '../labware/fixtures/2/fixture_lid.json'
import fixtureTiprack10ul from '../labware/fixtures/2/fixture_tiprack_10_ul.json'
import fixtureTiprack300ul from '../labware/fixtures/2/fixture_tiprack_300_ul.json'
import fixtureTrash from '../labware/fixtures/2/fixture_trash.json'
import labwareSchemaV2 from '../labware/schemas/2.json'
import labwareSchemaV3 from '../labware/schemas/3.json'
import { exactMatchOnlyLoadNames } from './constants'

import type {
  LabwareDef2ByDefURI,
  LabwareDefinition,
  LabwareDefinition1,
  LabwareDefinition2,
  LabwareDefinition3,
  LegacyLabwareDefByName,
} from './types'

const basename = (p: string): string => {
  const s = p.replace(/\\/g, '/').replace(/\/+$/g, '')
  const i = s.lastIndexOf('/')
  return i === -1 ? s : s.slice(i + 1)
}

// const extname = (p: string): string => {
//   const b = basename(p)
//   const i = b.lastIndexOf('.')
//   return i <= 0 ? '' : b.slice(i)
// }

// todo(mm, 2025-03-04): This duplicates getLabwareDefUri() in ./helpers. We should use
// that instead, but using it gives me obscure "TypeError: getLabwareDefURI is not a function"
// errors in certain test files. Some kind of circular dependency problem? Some kind of
// mocking problem?
function getLabwareDefURI(def: LabwareDefinition): string {
  return `${def.namespace}/${def.parameters.loadName}/${def.version}`
}

const schema1DefinitionsByPath: Record<string, LabwareDefinition1> =
  import.meta.glob('../labware/definitions/1/*.json', {
    eager: true,
    import: 'default',
  })
const schema2DefinitionsByPath: Record<string, LabwareDefinition2> =
  import.meta.glob('../labware/definitions/2/*/*.json', {
    eager: true,
    import: 'default',
  })
const schema3DefinitionsByPath: Record<string, LabwareDefinition3> =
  import.meta.glob('../labware/definitions/3/*/*.json', {
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
export function getAllDefinitions(
  blockList?: Set<string>
): LabwareDef2ByDefURI {
  if (blockList) {
    return Object.fromEntries(
      Object.entries(schema2DefinitionsByURI).filter(
        ([, labwareDef]) => !blockList.has(labwareDef.parameters.loadName)
      )
    )
  } else {
    return schema2DefinitionsByURI
  }
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
    const filename = basename(imgPath)
    const base = filename.replace(/\.[^.]+$/, '')
    const varName = base.replace(/\./g, '_').replace(/-/g, '_')
    imageKeyToUrl[varName] = imageModules[imgPath] as string
  }
  return imageKeyToUrl
}

const loadNames = Array.from(
  new Set(
    Object.keys(getAllDefinitions()).map(uri => {
      const parts = uri.split('/')
      return parts[1] ?? uri
    })
  )
)

function matchLoadNamestoURL(
  loadName: string,
  varName: string,
  exactMatchOnlyLoadNames: Set<string>
): boolean {
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

const adapters = ['aluminumblock', 'tuberack']

// Match images to load names
function buildSortedLabwareImages(
  loadNames: string[]
): Record<string, [string, ...string[]]> {
  const matchedImageVars = new Set<string>()
  const imageKeyToUrl = getAllImages()
  const labwareImages: Record<string, [string, ...string[]]> = {}

  for (const loadName of loadNames) {
    const matchingUrls = Object.entries(imageKeyToUrl)
      .filter(([varName]) =>
        matchLoadNamestoURL(loadName, varName, exactMatchOnlyLoadNames)
      )
      .map(([varName, url]) => {
        matchedImageVars.add(varName)
        return url
      })
    if (matchingUrls.length > 0) {
      labwareImages[loadName] = [matchingUrls[0], ...matchingUrls.slice(1)]
    }
  }
  // Add unmatched images to the object
  for (const [varName, url] of Object.entries(imageKeyToUrl)) {
    if (!matchedImageVars.has(varName)) {
      labwareImages[varName] = [url]
    }
  }

  // Sort the image URLs within each entry
  const sortedLabwareImages = Object.fromEntries(
    Object.entries(labwareImages).map(([key, urls]) => {
      const sortedUrls = [...urls].sort((a, b) => {
        const aMatches = adapters.some(substr => a.includes(substr))
        const bMatches = adapters.some(substr => b.includes(substr))

        if (aMatches && !bMatches) return -1
        if (!aMatches && bMatches) return 1

        return a.localeCompare(b)
      })

      return [key, [sortedUrls[0], ...sortedUrls.slice(1)]]
    })
  ) as Record<string, [string, ...string[]]>

  return sortedLabwareImages
}

let labwareImages: Record<string, string[]> = {}

function initializeLabwareImages(): void {
  labwareImages = buildSortedLabwareImages(loadNames)
}

initializeLabwareImages()

export {
  labwareImages,
  labwareSchemaV2,
  labwareSchemaV3,
  fixtureLid,
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
