// @flow
import assert from 'assert'

// TODO IMMEDIATELY review and confirm all mappings
const v1ModelTov2LoadNameMap = {
  '6-well-plate': 'corning_6_wellplate_16.8ml_flat',
  '12-well-plate': 'corning_12_wellplate_6.9ml_flat',
  '24-well-plate': 'corning_24_wellplate_3.4ml_flat',
  '48-well-plate': 'corning_48_wellplate_1.6ml_flat',
  '384-plate': 'corning_384_wellplate_112ul_flat',
  '96-deep-well': 'generic_96_wellplate_1.5ml_deep',
  '96-flat': 'generic_96_wellplate_340ul_flat',
  '96-PCR-flat': 'biorad_96_wellplate_200ul_pcr', // TODO: 96-PCR-flat not in spreadsheet
  '96-PCR-tall': 'generic_96_wellplate_300ul_pcr',
  'biorad-hardshell-96-PCR': 'biorad_96_wellplate_200ul_pcr',
  'fixed-trash': 'opentrons_1_trash_1100ml_fixed', // TODO: spreadsheet says to use the smaller one opentrons_1_trash_850ml_fixed but we should use the bigger one, right?
  'opentrons-aluminum-block-2ml-eppendorf':
    'opentrons_24_aluminumblock_generic_2ml_screwcap', // TODO: opentrons-aluminum-block-2ml-eppendorf not in spreadsheet
  'opentrons-aluminum-block-2ml-screwcap':
    'opentrons_24_aluminumblock_generic_2ml_screwcap',
  'opentrons-aluminum-block-96-PCR-plate':
    'opentrons_96_aluminumblock_biorad_wellplate_200ul',
  'opentrons-aluminum-block-PCR-strips-200ul':
    'opentrons_96_aluminumblock_generic_pcr_strip_200ul',
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
  'tiprack-10ul': 'opentrons_96_tiprack_10ul', // TODO: spreadsheet says to use GEB: geb_96_tiprack_10ul
  'tiprack-200ul': 'tipone_96_tiprack_200ul',
  'tiprack-1000ul': 'opentrons_96_tiprack_1000ul', // TODO: spreadsheet says to use GEB: geb_96_tiprack_1000ul
  'trough-12row': 'usascientific_12_reservoir_22ml',
  'tube-rack-.75ml': 'opentrons_24_tuberack_generic_0.75ml_snapcap_acrylic',
  'tube-rack-2ml':
    'opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap_acrylic',
  'tube-rack-15_50ml':
    'opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical_acrylic',
}
// TODO: missing mappings for:
// PCR-strip-tall
// trash-box

export default function v1LabwareModelToV2URI(model: string): string {
  const uri = `opentrons/${v1ModelTov2LoadNameMap[model]}/1`
  assert(uri, `expected a v2 URI for v1 labware model "${model}"`)
  return uri
}
