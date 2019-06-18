// @flow
import assert from 'assert'
import mapValues from 'lodash/mapValues'
import omit from 'lodash/omit'
import uniq from 'lodash/uniq'
import type {
  ProtocolFile,
  FileLabware,
  FilePipette,
} from '@opentrons/shared-data/protocol/flowTypes/schemaV3'
import { getAllDefinitions } from '../../labware-defs/utils'
import type { PDProtocolFile as PDProtocolFileV1, PDMetadata } from './1_1_0'

// NOTE: PDMetadata type did not change btw 1.1.0 and 3.0.0
export type PDProtocolFile = ProtocolFile<PDMetadata>

// the version and schema for this migration
export const PD_VERSION = '3.0.0'
export const SCHEMA_VERSION = 3

// TODO IMMEDIATELY review and confirm all mappings
const modelToURIMap = {
  '12-well-plate': 'corning_12_wellplate_6.9ml_flat',
  '24-well-plate': 'corning_24_wellplate_3.4ml_flat',
  '384-plate': 'corning_384_wellplate_112ul_flat',
  '48-well-plate': 'corning_48_wellplate_1.6ml_flat',
  '6-well-plate': 'corning_6_wellplate_16.8ml_flat',
  '96-PCR-flat': 'biorad_96_wellplate_200ul_pcr',
  '96-flat': 'generic_96_wellplate_340ul_flat',
  'biorad-hardshell-96-PCR': 'biorad_96_wellplate_200ul_pcr',
  'opentrons-aluminum-block-2ml-eppendorf':
    'opentrons_24_aluminumblock_generic_2ml_screwcap',
  'opentrons-aluminum-block-2ml-screwcap':
    'opentrons_24_aluminumblock_generic_2ml_screwcap',
  'opentrons-aluminum-block-96-PCR-plate':
    'opentrons_96_aluminumblock_biorad_wellplate_200ul',
  'opentrons-tiprack-300ul': 'opentrons_96_tiprack_300ul',
  'opentrons-tuberack-1.5ml-eppendorf':
    'opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap',
  'opentrons-tuberack-15_50ml':
    'opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical',
  'opentrons-tuberack-15ml': 'opentrons_15_tuberack_falcon_15ml_conical',
  'opentrons-tuberack-2ml-eppendorf':
    'opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap',
  'opentrons-tuberack-2ml-screwcap':
    'opentrons_24_tuberack_generic_2ml_screwcap',
  'opentrons-tuberack-50ml': 'opentrons_6_tuberack_falcon_50ml_conical',
  'tiprack-1000ul': 'opentrons_96_tiprack_1000ul',
  'tiprack-10ul': 'opentrons_96_tiprack_10ul',
  'trough-12row': 'usascientific_12_reservoir_22ml',
  'fixed-trash': 'opentrons_1_trash_1100ml_fixed',
}

function v1LabwareModelToV2URI(model: string): string {
  const uri = `opentrons/${modelToURIMap[model]}/1`
  assert(uri, `expected a v2 URI for v1 labware model "${model}"`)
  return uri
}

function migrateMetadata(
  metadata: $PropertyType<PDProtocolFileV1, 'metadata'>
): $PropertyType<PDProtocolFile, 'metadata'> {
  const metadataExtraKeys: typeof metadata = {
    ...metadata,
    protocolName: metadata['protocol-name'],
    lastModified: metadata['last-modified'],
  }
  return omit(metadataExtraKeys, ['protocol-name', 'last-modified'])
}

type FilePipettes = $PropertyType<PDProtocolFile, 'pipettes'>
function migratePipettes(
  pipettes: $PropertyType<PDProtocolFileV1, 'pipettes'>
): FilePipettes {
  return Object.keys(pipettes).reduce<FilePipettes>(
    (acc, pipetteId: string) => {
      const oldPipette = pipettes[pipetteId]
      const nextPipette: FilePipette = {
        mount: oldPipette.mount,
        name: oldPipette.name || (oldPipette.model || '').split('_v')[0],
      }
      // NOTE: the hacky model to name ('p10_single_v1.3' -> 'p10_single') fallback
      // should already be handled in most cases, this is just for safety
      return { ...acc, [pipetteId]: nextPipette }
    },
    {}
  )
}

type FileLabwares = $PropertyType<PDProtocolFile, 'labware'>
function migrateLabware(
  labware: $PropertyType<PDProtocolFileV1, 'labware'>
): FileLabwares {
  return Object.keys(labware).reduce<FileLabwares>((acc, labwareId: string) => {
    const oldLabware = labware[labwareId]
    const nextLabware: FileLabware = {
      slot: oldLabware.slot,
      displayName: oldLabware['display-name'],
      definitionId: v1LabwareModelToV2URI(oldLabware.model),
    }
    return { ...acc, [labwareId]: nextLabware }
  }, {})
}

type LabwareDefinitions = $PropertyType<PDProtocolFile, 'labwareDefinitions'>
function getLabwareDefinitions(
  labware: $PropertyType<PDProtocolFileV1, 'labware'>
): LabwareDefinitions {
  const allLabwareModels = uniq(
    Object.keys(labware).map((labwareId: string) => labware[labwareId].model)
  )
  const allLabwareURIs = allLabwareModels.map(v1LabwareModelToV2URI)
  return allLabwareURIs.reduce<LabwareDefinitions>((acc, uri: string) => {
    const labwareDef = getAllDefinitions()[uri]
    assert(labwareDef, `could not find labware def for ${uri}`)
    return { ...acc, [uri]: labwareDef }
  }, {})
}

function migrateAppData(appData: PDMetadata): PDMetadata {
  // update pipette tiprack v1 model to v2 URI
  return {
    ...appData,
    pipetteTiprackAssignments: mapValues(
      appData.pipetteTiprackAssignments,
      model => v1LabwareModelToV2URI(model)
    ),
  }
}

const migrateFile = (fileData: PDProtocolFileV1): PDProtocolFile => {
  return {
    designerApplication: {
      name: 'opentrons/protocol-designer',
      version: PD_VERSION,
      data: migrateAppData(fileData['designer-application'].data),
    },
    schemaVersion: SCHEMA_VERSION,
    metadata: migrateMetadata(fileData.metadata),
    robot: fileData.robot,
    pipettes: migratePipettes(fileData.pipettes),
    labware: migrateLabware(fileData.labware),
    labwareDefinitions: getLabwareDefinitions(fileData.labware),
    commands: [], // NOTE: these will be generated by PD upon import
  }
}

export default migrateFile
