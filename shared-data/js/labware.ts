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
import { labwareImages } from '../labware/images/image_details/labware-images-generated'
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

import eppendorf_96_tiprack_10ul_eptips from '../labware/images/eppendorf_10ul_tips_eptips_side_view.jpg'
import eppendorf_96_tiprack_1000ul_eptips from '../labware/images/eppendorf_1000ul_tip_eptips_side_view.jpg'
import geb_96_tiprack_10ul from '../labware/images/geb_96_tiprack_10ul_side_view.jpg'
import geb_96_tiprack_1000ul from '../labware/images/geb_96_tiprack_1000ul_side_view.jpg'
import generic_custom_tiprack from '../labware/images/generic_tiprack_side_view.png'
import opentrons_96_tiprack_10ul_side_view from '../labware/images/opentrons_96_tiprack_10ul_side_view.jpg'
import opentrons_96_tiprack_300ul_side_view from '../labware/images/opentrons_96_tiprack_300ul_side_view.jpg'
import opentrons_96_tiprack_1000ul_side_view from '../labware/images/opentrons_96_tiprack_1000ul_side_view.jpg'
import opentrons_calibrationblock from '../labware/images/opentrons_calibration_block.png'
import removable_black_plastic_trash_bin from '../labware/images/removable_black_plastic_trash_bin.png'
import tipone_96_tiprack_200ul from '../labware/images/tipone_96_tiprack_200ul_side_view.jpg'

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

export {
  labwareImages,
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
  eppendorf_96_tiprack_10ul_eptips,
  eppendorf_96_tiprack_1000ul_eptips,
  geb_96_tiprack_10ul,
  geb_96_tiprack_1000ul,
  generic_custom_tiprack,
  opentrons_96_tiprack_10ul_side_view,
  opentrons_96_tiprack_300ul_side_view,
  opentrons_96_tiprack_1000ul_side_view,
  opentrons_calibrationblock,
  removable_black_plastic_trash_bin,
  tipone_96_tiprack_200ul,
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
